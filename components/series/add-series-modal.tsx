"use client";

import {
  checkDuplicateSeries,
  createSeries,
  createSeriesWithVolumes,
  type CreateSeriesInput,
} from "@/actions/series";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { getVolumeCovers } from "@/actions/mangadex";
import {
  generateVolumeEntries,
  type FormattedMangaData,
  type VolumeData,
} from "@/lib/manga-api";
import { getSeriesFormDefaults } from "@/lib/form-defaults";
import { seriesSchema, type SeriesSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Edit3, Loader2, Plus, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { MangaSearch } from "./manga-search";
import { SeriesFormFields } from "./series-form-fields";

type Publisher = { id: string; name: string };

type AddSeriesModalProps = {
  publishers?: Publisher[];
};

export function AddSeriesModal({ publishers = [] }: AddSeriesModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
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
    watch,
    reset,
    formState: { isSubmitting },
  } = methods;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setShowSearch(true);
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

    // Set form values immediately
    setValue("title", data.title);
    setValue("author", data.author);
    setValue("totalVolumes", data.totalVolumes || null);
    setValue("coverImage", data.coverImage);
    setValue("description", data.description);
    setValue("publishing", data.publishing);
    setValue("mangadexId", data.mangadexId);

    // Show loading state while fetching volumes
    setShowSearch(false);

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

  const onSubmit: SubmitHandler<SeriesSchema> = async (data) => {
    try {
      const input: CreateSeriesInput = {
        title: data.title,
        author: data.author,
        publisherId: data.publisherId || undefined,
        status: data.status,
        publishing: data.publishing,
        totalVolumes: data.totalVolumes ?? null,
        coverImage: data.coverImage,
        description: data.description || undefined,
        retailPrice: data.retailPrice ?? null,
        mangadexId: data.mangadexId || undefined,
      };

      if (volumeData.length > 0) {
        await createSeriesWithVolumes(
          input,
          volumeData.map((v) => ({
            volumeNumber: v.volumeNumber,
            title: v.title,
            coverImage: v.coverImage,
          })),
        );
      } else if (input.totalVolumes && input.totalVolumes > 0) {
        const volumes = generateVolumeEntries(input.totalVolumes);
        await createSeriesWithVolumes(input, volumes);
      } else {
        await createSeries(input);
      }

      toast.success(`${data.title} added to your collection`);
      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create series",
      );
    }
  };

  const totalVolumesNum = watch("totalVolumes") || 0;
  const coverImage = watch("coverImage");

  const volumesWithCovers = volumeData.filter((v) => v.coverImage);
  const previewVolumes = volumeData.slice(0, 10);
  const remainingCount = volumeData.length - previewVolumes.length;

  return (
    <>
      <Button onClick={() => handleOpenChange(true)} className="gap-2">
        <Plus className="w-5 h-5" />
        Add Series
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => handleOpenChange(false)}
        title={showSearch ? "Add New Series" : "Series Details"}
        maxWidth="lg"
      >
        {showSearch ? (
          <div className="space-y-6">
            <MangaSearch onSelect={handleSearchSelect} />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background-secondary px-4 text-foreground-muted">
                  or
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowSearch(false)}
              className="w-full h-14"
            >
              <Edit3 className="w-5 h-5" />
              Enter manually
            </Button>
          </div>
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
                onClick={() => {
                  setShowSearch(true);
                  setVolumeData([]);
                }}
                className="h-auto p-0 gap-1 text-sm"
              >
                <Search className="w-4 h-4" />
                Search again
              </Button>

              {coverImage && (
                <div className="flex justify-center">
                  <Image
                    width={96}
                    height={128}
                    src={coverImage}
                    alt="Cover preview"
                    className="rounded-xl object-cover shadow-lg"
                  />
                </div>
              )}

              <SeriesFormFields publishers={publishers} />

              {/* Volume cover preview */}
              {volumeData.length > 0 ? (
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl space-y-3">
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
                  <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
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
                  Add Series
                </Button>
              </div>
            </form>
          </FormProvider>
        )}
      </Modal>
    </>
  );
}
