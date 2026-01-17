"use client";

import { useState, useEffect } from "react";
import {
  updateSeries,
  deleteSeries,
  type UpdateSeriesInput,
} from "@/actions/series";
import { Loader2, Settings, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import type { Series } from "@/lib/generated/prisma/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  { value: "", label: "Select editorial..." },
  { value: "PLANETA_COMIC", label: "Planeta Cómic" },
  { value: "PLANETA_DEAGOSTINI", label: "Planeta DeAgostini" },
];

type EditSeriesModalProps = {
  series: Series;
};

export function EditSeriesModal({ series }: EditSeriesModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SeriesSchema>({
    resolver: zodResolver(seriesSchema),
    defaultValues: {
      title: series.title,
      author: series.author || "",
      editorial: series.editorial,
      status: series.status,
      publishing: series.publishing,
      totalVolumes: series.totalVolumes,
      retailPrice: series.retailPrice,
      coverImage: series.coverImage || "",
      description: series.description || "",
      malId: series.malId,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        title: series.title,
        author: series.author || "",
        editorial: series.editorial,
        status: series.status,
        publishing: series.publishing,
        totalVolumes: series.totalVolumes || null,
        retailPrice: series.retailPrice,
        coverImage: series.coverImage || "",
        description: series.description || "",
        malId: series.malId || null,
      });
    }
  }, [isOpen, series, reset]);

  const onSubmit: SubmitHandler<SeriesSchema> = async (data) => {
    try {
      const input: UpdateSeriesInput = {
        title: data.title,
        author: data.author || undefined,
        editorial: (data.editorial || undefined) as Editorial | undefined,
        status: data.status,
        publishing: data.publishing,
        totalVolumes: data.totalVolumes ?? undefined,
        coverImage: data.coverImage || undefined,
        description: data.description || undefined,
        retailPrice: data.retailPrice ?? undefined,
        malId: data.malId ?? undefined,
      };

      await updateSeries(series.id, input);
      toast.success(`${series.title} updated`);
      setIsOpen(false);
      window.dispatchEvent(new CustomEvent("stats-update"));
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update series",
      );
    }
  };

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteSeries(series.id);
      toast.success(`${series.title} deleted`);
      window.dispatchEvent(new CustomEvent("stats-update"));
      router.push("/dashboard/series");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete series",
      );
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="text-foreground-muted hover:text-foreground"
        title="Edit series"
      >
        <Settings className="w-5 h-5" />
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Edit Series"
      >
        {showDeleteConfirm ? (
          <div className="space-y-4">
            <div className="p-4 bg-error/10 border border-error/20 rounded-xl">
              <h3 className="font-semibold text-error mb-2">Delete Series?</h3>
              <p className="text-sm text-foreground-muted">
                This will permanently delete &quot;{series.title}&quot; and all
                its volumes. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" type="text" {...register("title")} />
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
                />
              </div>
              <div>
                <Label htmlFor="retailPrice">Retail Price (EUR)</Label>
                <Input
                  id="retailPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("retailPrice", { valueAsNumber: true })}
                />
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

            <div>
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input id="coverImage" type="url" {...register("coverImage")} />
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
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="destructive"
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
