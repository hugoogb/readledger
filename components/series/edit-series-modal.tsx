"use client";

import { useState, useEffect } from "react";
import {
  updateSeries,
  deleteSeries,
} from "@/actions/series";
import { Settings, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import type { Series } from "@/lib/generated/prisma/browser";
import { Button } from "@/components/ui/button";
import { useForm, FormProvider, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSeriesFormDefaults } from "@/lib/form-defaults";
import { seriesSchema, type SeriesSchema } from "@/lib/validations";
import { toast } from "sonner";
import { SeriesFormFields } from "./series-form-fields";
import { unwrap } from "@/lib/unwrap";
import { errorMessage } from "@/lib/utils";

type Publisher = { id: string; name: string };

type EditSeriesModalProps = {
  series: Series;
  publishers?: Publisher[];
  /**
   * "icon" (default): the gear button. "seriesHint": a "Part of a series?"
   * link for a single book that may really be a partly imported series; it
   * opens the same form with total volumes focused.
   */
  variant?: "icon" | "seriesHint";
};

export function EditSeriesModal({ series, publishers = [], variant = "icon" }: EditSeriesModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const methods = useForm<SeriesSchema>({
    resolver: zodResolver(seriesSchema),
    defaultValues: getSeriesFormDefaults(series),
  });

  const { handleSubmit, reset, setFocus, formState: { isSubmitting } } = methods;

  useEffect(() => {
    if (!isOpen) return;
    reset(getSeriesFormDefaults(series));
    if (variant !== "seriesHint") return;
    // After the modal's focus trap has focused its first field.
    const timer = setTimeout(() => setFocus("totalVolumes", { shouldSelect: true }), 0);
    return () => clearTimeout(timer);
  }, [isOpen, series, reset, setFocus, variant]);

  const onSubmit: SubmitHandler<SeriesSchema> = async (data) => {
    try {
      // Validated by the form; blanks clear the field (see services/series).
      unwrap(await updateSeries(series.id, data));
      toast.success(`${series.title} updated`);
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to save changes"));
    }
  };

  async function handleDelete() {
    setIsDeleting(true);
    try {
      unwrap(await deleteSeries(series.id));
      toast.success(`${series.title} deleted`);
      router.push("/dashboard/library");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete"));
      setIsDeleting(false);
    }
  }

  return (
    <>
      {variant === "seriesHint" ? (
        <Button
          variant="link"
          type="button"
          onClick={() => setIsOpen(true)}
          className="h-auto min-h-11 p-0 text-sm"
        >
          Part of a series? Set total volumes
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="text-foreground-muted hover:text-foreground"
          aria-label="Edit details"
          title="Edit details"
        >
          <Settings className="w-5 h-5" />
        </Button>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Edit details"
      >
        {showDeleteConfirm ? (
          <div className="space-y-4">
            <div className="p-4 bg-error/10 border border-error/20 rounded-md">
              <h3 className="font-semibold text-error mb-2">Delete from library?</h3>
              <p className="text-sm text-foreground-muted">
                This will permanently delete &quot;{series.title}&quot; and
                everything you tracked for it. This action cannot be undone.
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
                loading={isDeleting}
                className="flex-1 gap-2"
              >
                {!isDeleting && <Trash2 className="w-4 h-4" />}
                Delete
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
                  aria-label="Delete from library"
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
                <Button type="submit" loading={isSubmitting} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </form>
          </FormProvider>
        )}
      </Modal>
    </>
  );
}
