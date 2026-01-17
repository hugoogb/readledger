"use client";

import { useState } from "react";
import {
  createSeries,
  createSeriesWithVolumes,
  type CreateSeriesInput,
} from "@/actions/series";
import { Loader2, Plus, Search, Edit3, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { MangaSearch } from "./manga-search";
import {
  generateVolumeEntries,
  type FormattedMangaData,
} from "@/lib/manga-api";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { seriesSchema, type SeriesSchema } from "@/lib/validations";
import { toast } from "sonner";
import { SeriesStatus, Editorial } from "@/lib/generated/prisma/enums";

const statusOptions = [
  { value: SeriesStatus.READING, label: "Reading" },
  { value: SeriesStatus.COMPLETED, label: "Completed" },
  { value: SeriesStatus.ON_HOLD, label: "On Hold" },
  { value: SeriesStatus.DROPPED, label: "Dropped" },
  { value: SeriesStatus.PLAN_TO_READ, label: "Plan to Read" },
];

const editorialOptions = [
  { value: Editorial.PLANETA_COMIC, label: "Planeta Cómic" },
  { value: Editorial.PLANETA_DEAGOSTINI, label: "Planeta DeAgostini" },
];

export function AddSeriesModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SeriesSchema>({
    resolver: zodResolver(seriesSchema),
    defaultValues: {
      status: SeriesStatus.READING,
      publishing: false,
      title: "",
      author: "",
      editorial: Editorial.PLANETA_COMIC,
      coverImage: "",
      description: "",
      totalVolumes: null,
      retailPrice: null,
      malId: null,
    },
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setShowSearch(true);
      reset();
    }
  };

  const handleSearchSelect = (data: FormattedMangaData) => {
    setValue("title", data.title);
    setValue("author", data.author);
    setValue("totalVolumes", data.totalVolumes || null);
    setValue("coverImage", data.coverImage);
    setValue("description", data.description);
    setValue("publishing", data.publishing);
    setValue("malId", data.malId);
    setShowSearch(false);
  };

  const handleManualEntry = () => {
    setShowSearch(false);
  };

  const handleBackToSearch = () => {
    setShowSearch(true);
  };

  const onSubmit: SubmitHandler<SeriesSchema> = async (data) => {
    try {
      const input: CreateSeriesInput = {
        title: data.title,
        author: data.author,
        editorial: data.editorial || undefined,
        status: data.status,
        publishing: data.publishing,
        totalVolumes: data.totalVolumes || undefined,
        coverImage: data.coverImage,
        description: data.description || undefined,
        retailPrice: data.retailPrice || undefined,
        malId: data.malId || undefined,
      };

      if (input.totalVolumes && input.totalVolumes > 0) {
        const volumes = generateVolumeEntries(input.totalVolumes);
        await createSeriesWithVolumes(input, volumes);
      } else {
        await createSeries(input);
      }

      toast.success(`${data.title} added to your collection`);
      handleOpenChange(false);
      window.dispatchEvent(new CustomEvent("stats-update"));
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create series",
      );
    }
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const totalVolumesNum = watch("totalVolumes") || 0;
  const coverImage = watch("coverImage");

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
              onClick={handleManualEntry}
              className="w-full h-14"
            >
              <Edit3 className="w-5 h-5" />
              Enter manually
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Button
              variant="link"
              type="button"
              onClick={handleBackToSearch}
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

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                type="text"
                {...register("title")}
                placeholder="One Piece"
              />
              {errors.title && (
                <p className="text-xs text-error mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  type="text"
                  {...register("author")}
                  placeholder="Eiichiro Oda"
                />
                {errors.author && (
                  <p className="text-xs text-error mt-1">
                    {errors.author.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="editorial">Editorial</Label>
                <Select id="editorial" {...register("editorial")}>
                  {editorialOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalVolumes">Total Volumes</Label>
                <Input
                  id="totalVolumes"
                  type="number"
                  min="0"
                  {...register("totalVolumes", { valueAsNumber: true })}
                  placeholder="109"
                />
                {errors.totalVolumes && (
                  <p className="text-xs text-error mt-1">
                    {errors.totalVolumes.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="retailPrice">Retail Price (EUR)</Label>
                <Input
                  id="retailPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("retailPrice", { valueAsNumber: true })}
                  placeholder="9.95"
                />
                {errors.retailPrice && (
                  <p className="text-xs text-error mt-1">
                    {errors.retailPrice.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Reading Status</Label>
                <Select id="status" {...register("status")}>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex items-end pb-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      {...register("publishing")}
                      className="peer w-5 h-5 rounded border-border bg-background-tertiary text-accent focus:ring-accent focus:ring-offset-0 transition-all cursor-pointer opacity-0 absolute inset-0 z-10"
                    />
                    <div className="w-5 h-5 rounded border border-border bg-background-tertiary peer-checked:bg-accent peer-checked:border-accent transition-all flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <span className="text-sm font-medium group-hover:text-foreground transition-colors">
                    Still Publishing
                  </span>
                </label>
              </div>
            </div>

            {totalVolumesNum > 0 && (
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-accent shrink-0" />
                  <div>
                    <div className="font-medium">
                      {totalVolumesNum} volume entries will be created
                    </div>
                    <p className="text-sm text-foreground-muted mt-0.5">
                      You can then mark which ones you own, have read, or are
                      missing
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                type="url"
                {...register("coverImage")}
                placeholder="https://..."
              />
              {errors.coverImage && (
                <p className="text-xs text-error mt-1">
                  {errors.coverImage.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                {...register("description")}
                placeholder="Brief description..."
              />
              {errors.description && (
                <p className="text-xs text-error mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

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
                disabled={isSubmitting}
                className="flex-1 gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Add Series"
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
