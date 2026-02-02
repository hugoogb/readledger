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
import { useForm, FormProvider, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { seriesSchema, type SeriesSchema } from "@/lib/validations";
import { toast } from "sonner";
import { SeriesFormFields } from "./series-form-fields";

type Publisher = { id: string; name: string };

type EditSeriesModalProps = {
  series: Series;
  publishers?: Publisher[];
};

export function EditSeriesModal({ series, publishers = [] }: EditSeriesModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const methods = useForm<SeriesSchema>({
    resolver: zodResolver(seriesSchema),
    defaultValues: {
      title: series.title,
      author: series.author || "",
      publisherId: series.publisherId || "",
      status: series.status,
      publishing: series.publishing,
      totalVolumes: series.totalVolumes,
      retailPrice: series.retailPrice,
      coverImage: series.coverImage || "",
      description: series.description || "",
      mangadexId: series.mangadexId,
    },
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  useEffect(() => {
    if (isOpen) {
      reset({
        title: series.title,
        author: series.author || "",
        publisherId: series.publisherId || "",
        status: series.status,
        publishing: series.publishing,
        totalVolumes: series.totalVolumes || null,
        retailPrice: series.retailPrice,
        coverImage: series.coverImage || "",
        description: series.description || "",
        mangadexId: series.mangadexId || null,
      });
    }
  }, [isOpen, series, reset]);

  const onSubmit: SubmitHandler<SeriesSchema> = async (data) => {
    try {
      const input: UpdateSeriesInput = {
        title: data.title,
        author: data.author || undefined,
        publisherId: data.publisherId || undefined,
        status: data.status,
        publishing: data.publishing,
        totalVolumes: data.totalVolumes ?? undefined,
        coverImage: data.coverImage || undefined,
        description: data.description || undefined,
        retailPrice: data.retailPrice ?? undefined,
        mangadexId: data.mangadexId ?? undefined,
      };

      await updateSeries(series.id, input);
      toast.success(`${series.title} updated`);
      setIsOpen(false);
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
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <SeriesFormFields publishers={publishers} />

              <div className="flex gap-3 pt-2">
                <Button
                  variant="destructive"
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3"
                  aria-label="Delete series"
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
          </FormProvider>
        )}
      </Modal>
    </>
  );
}
