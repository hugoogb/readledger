"use client";

import { getBookDetails } from "@/actions/openlibrary";
import {
  checkDuplicateSeries,
  createSeries,
  createSeriesWithVolumes,
  getExistingOpenLibraryKeys,
  type CreateSeriesInput,
  type VolumeInput,
} from "@/actions/series";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { getVolumeCovers } from "@/actions/mangadex";
import {
  generateVolumeEntries,
  type FormattedMangaData,
  type VolumeData,
} from "@/lib/manga-api";
import type { BookSearchResult } from "@/lib/openlibrary-api";
import { getSeriesFormDefaults } from "@/lib/form-defaults";
import { Format } from "@/lib/generated/prisma/enums";
import { seriesSchema, type SeriesSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, BookOpen, Loader2, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FormProvider, useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { LibrarySearch } from "./library-search";
import { SeriesFormFields } from "./series-form-fields";
import { unwrap } from "@/lib/unwrap";

type Publisher = { id: string; name: string };

type AddSeriesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publishers: Publisher[];
  /** Show Open Library results above MangaDex ones (see booksFirstInSearch). */
  booksFirst: boolean;
  onPublisherCreated: (publisher: Publisher) => void;
};

type Step = "search" | "form";
type Kind = "single" | "series";
// Where the form's values came from. MangaDex results are always series;
// manual entries and Open Library books can be a single book or a series.
type Source = "manual" | "mangadex" | "openlibrary";

export function AddSeriesModal({
  open: isOpen,
  onOpenChange,
  publishers,
  booksFirst,
  onPublisherCreated,
}: AddSeriesModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<Source>("mangadex");
  const [kind, setKind] = useState<Kind>("series");
  // ISBN from an Open Library ISBN lookup, stored on volume 1.
  const [bookIsbn, setBookIsbn] = useState<string | null>(null);
  // Ignores a late description for a book the user has already left.
  const selection = useRef(0);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [isFetchingVolumes, setIsFetchingVolumes] = useState(false);
  const [fetchTotal, setFetchTotal] = useState(0);

  const methods = useForm<SeriesSchema>({
    resolver: zodResolver(seriesSchema),
    defaultValues: getSeriesFormDefaults(),
  });

  const {
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { isSubmitting },
  } = methods;

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setStep("search");
      setQuery("");
      setSource("mangadex");
      setKind("series");
      setBookIsbn(null);
      selection.current++;
      setVolumeData([]);
      setIsFetchingVolumes(false);
      reset();
    }
  };

  const handleSearchSelect = async (data: FormattedMangaData) => {
    // Check for duplicate
    if (data.mangadexId) {
      const isDuplicate = await checkDuplicateSeries(data.mangadexId);
      if (isDuplicate) {
        toast.warning(`"${data.title}" is already in your collection`);
        return;
      }
    }

    // Set form values immediately. MangaDex can't tell light novels apart;
    // the user can change the format in the form.
    reset(getSeriesFormDefaults());
    setSource("mangadex");
    setKind("series");
    setBookIsbn(null);
    setValue("format", Format.MANGA);
    setValue("title", data.title);
    setValue("author", data.author);
    setValue("totalVolumes", data.totalVolumes || null);
    setValue("coverImage", data.coverImage);
    setValue("description", data.description);
    setValue("publishing", data.publishing);
    setValue("mangadexId", data.mangadexId);

    // Show loading state while fetching volumes
    setStep("form");

    if (data.totalVolumes && data.totalVolumes > 0) {
      setIsFetchingVolumes(true);
      setFetchTotal(data.totalVolumes);
      try {
        const volumes = await getVolumeCovers(
          data.mangadexId,
          data.totalVolumes,
        );
        setVolumeData(volumes);
      } catch {
        // Fallback to placeholder volumes
        const placeholders = generateVolumeEntries(data.totalVolumes);
        setVolumeData(
          placeholders.map((v) => ({
            ...v,
            coverImage: null,
            isbn: null,
          })),
        );
      } finally {
        setIsFetchingVolumes(false);
      }
    }
  };

  const handleBookSelect = async (book: BookSearchResult) => {
    const [existing] = await getExistingOpenLibraryKeys([book.key]);
    if (existing) {
      toast.warning(`"${book.title}" is already in your library`);
      return;
    }

    // Books are added as a single book; the user can switch to Series.
    reset({
      ...getSeriesFormDefaults(),
      format: book.formatGuess === "COMIC" ? Format.COMIC : Format.NOVEL,
      title: book.title,
      author: book.authors.join(", "),
      coverImage: book.coverImage,
      openLibraryKey: book.key,
      totalVolumes: 1,
      publishing: false,
    });
    setSource("openlibrary");
    setKind("single");
    setBookIsbn(book.isbn);
    setVolumeData([]);
    setStep("form");

    // The description needs one more request; show the form without waiting
    // and fill it in unless the user has typed one or moved on.
    const token = ++selection.current;
    const details = await getBookDetails(book.key);
    if (token !== selection.current || !details.ok || !details.data.description) return;
    if (!getValues("description")) setValue("description", details.data.description);
  };

  const onSubmit: SubmitHandler<SeriesSchema> = async (data) => {
    try {
      const input: CreateSeriesInput = {
        title: data.title,
        author: data.author,
        publisherId: data.publisherId || undefined,
        status: data.status,
        format: data.format,
        publishing: data.publishing,
        totalVolumes: data.totalVolumes ?? null,
        coverImage: data.coverImage,
        description: data.description || undefined,
        retailPrice: data.retailPrice ?? null,
        mangadexId: data.mangadexId || undefined,
        openLibraryKey: data.openLibraryKey || undefined,
      };

      let volumes: VolumeInput[] =
        volumeData.length > 0
          ? volumeData.map((v) => ({
              volumeNumber: v.volumeNumber,
              title: v.title,
              coverImage: v.coverImage,
            }))
          : generateVolumeEntries(input.totalVolumes ?? 0);
      if (bookIsbn) {
        // Switched to "Series" with no total: keep the looked-up ISBN by
        // creating volume 1 for it rather than dropping it.
        if (volumes.length === 0) volumes = [{ volumeNumber: 1 }];
        volumes = volumes.map((v) => (v.volumeNumber === 1 ? { ...v, isbn: bookIsbn } : v));
      }

      if (volumes.length > 0) {
        unwrap(await createSeriesWithVolumes(input, volumes));
      } else {
        unwrap(await createSeries(input));
      }

      toast.success(`${data.title} added to your library`);
      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add to your library",
      );
    }
  };

  const startManual = () => {
    reset({
      ...getSeriesFormDefaults(),
      format: Format.NOVEL,
      totalVolumes: 1,
      publishing: false,
    });
    setSource("manual");
    setKind("single");
    setBookIsbn(null);
    setVolumeData([]);
    setStep("form");
  };

  const chooseKind = (next: Kind) => {
    setKind(next);
    if (next === "single") {
      setValue("totalVolumes", 1);
      setValue("publishing", false);
    } else {
      setValue("totalVolumes", null);
    }
  };

  const goBack = () => {
    selection.current++;
    setVolumeData([]);
    setBookIsbn(null);
    setStep("search");
    reset(getSeriesFormDefaults());
  };

  const canChooseKind = source !== "mangadex";
  const isSingle = canChooseKind && kind === "single";
  const totalVolumesNum = watch("totalVolumes") || 0;
  const coverImage = watch("coverImage");

  const volumesWithCovers = volumeData.filter((v) => v.coverImage);
  const previewVolumes = volumeData.slice(0, 10);
  const remainingCount = volumeData.length - previewVolumes.length;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => handleOpenChange(false)}
        title={step === "search" ? "Add to library" : isSingle ? "Book details" : "Series details"}
        maxWidth="lg"
      >
        {step === "search" ? (
          <LibrarySearch
            query={query}
            onQueryChange={setQuery}
            booksFirst={booksFirst}
            onSelectManga={handleSearchSelect}
            onSelectBook={handleBookSelect}
            onAddManually={startManual}
          />
        ) : isFetchingVolumes ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-sm text-foreground-muted text-center">
              Fetching covers for {fetchTotal} volumes...
            </p>
          </div>
        ) : (
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Button
                variant="link"
                type="button"
                onClick={goBack}
                className="h-auto p-0 gap-1 text-sm"
              >
                {source === "manual" ? <ArrowLeft className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                {source === "manual" ? "Back" : "Search again"}
              </Button>

              {coverImage && (
                <div className="flex justify-center">
                  <Image
                    width={96}
                    height={128}
                    src={coverImage}
                    alt="Cover preview"
                    className="rounded-md object-cover shadow-lg"
                  />
                </div>
              )}

              <SeriesFormFields
                publishers={publishers}
                onPublisherCreated={onPublisherCreated}
                kind={isSingle ? "single" : "series"}
                afterFormat={
                  canChooseKind && (
                    <div
                      role="group"
                      aria-label="Single book or series"
                      className="grid grid-cols-2 gap-1 rounded-md bg-background-tertiary p-1"
                    >
                      {(["single", "series"] as const).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => chooseKind(k)}
                          aria-pressed={kind === k}
                          className={`min-h-11 rounded-lg text-sm font-semibold transition-colors ${
                            kind === k
                              ? "bg-background text-foreground shadow-sm"
                              : "text-foreground-muted hover:text-foreground"
                          }`}
                        >
                          {k === "single" ? "Single book" : "Series"}
                        </button>
                      ))}
                    </div>
                  )
                }
              />

              {/* Volume cover preview */}
              {isSingle ? null : volumeData.length > 0 ? (
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-md space-y-3">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-accent shrink-0" />
                    <div>
                      <div className="font-medium">
                        {volumeData.length} volume entries will be created
                      </div>
                      {volumesWithCovers.length > 0 && (
                        <p className="text-sm text-foreground-muted mt-0.5">
                          {volumesWithCovers.length} with cover images from
                          MangaDex
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {previewVolumes.map((vol) => (
                      <div
                        key={vol.volumeNumber}
                        className="shrink-0 w-16 text-center"
                      >
                        {vol.coverImage ? (
                          <Image
                            width={64}
                            height={96}
                            src={vol.coverImage}
                            alt={`Vol. ${vol.volumeNumber}`}
                            className="rounded-lg object-cover shadow-sm w-16 h-24"
                          />
                        ) : (
                          <div className="w-16 h-24 rounded-lg bg-background-tertiary flex items-center justify-center">
                            <span className="text-xs text-foreground-muted font-medium">
                              {vol.volumeNumber}
                            </span>
                          </div>
                        )}
                        <p className="text-[10px] text-foreground-muted mt-1 truncate">
                          Vol. {vol.volumeNumber}
                        </p>
                      </div>
                    ))}
                    {remainingCount > 0 && (
                      <div className="shrink-0 w-16 flex items-center justify-center">
                        <span className="text-sm text-foreground-muted font-medium">
                          +{remainingCount} more
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                totalVolumesNum > 0 && (
                  <div className="p-4 bg-accent/5 border border-accent/20 rounded-md">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-accent shrink-0" />
                      <div>
                        <div className="font-medium">
                          {totalVolumesNum} volume entries will be created
                        </div>
                        <p className="text-sm text-foreground-muted mt-0.5">
                          You can then mark which ones you own, have read, or
                          are missing
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="flex-1 gap-2"
                >
                  {isSingle ? "Add book" : "Add series"}
                </Button>
              </div>
            </form>
          </FormProvider>
        )}
      </Modal>
    </>
  );
}
