"use client";

import { useState } from "react";
import { updateSeries, deleteSeries } from "@/actions/series";
import { Loader2, Settings, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Editorial, Series } from "@/lib/generated/prisma/client";
import { SeriesStatus } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const statusOptions = [
  { value: "READING", label: "Reading" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "DROPPED", label: "Dropped" },
  { value: "PLAN_TO_READ", label: "Plan to Read" },
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
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(series.publishing);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      await updateSeries(series.id, {
        title: formData.get("title") as string,
        author: (formData.get("author") as string) || undefined,
        editorial: (formData.get("editorial") as Editorial) || undefined,
        status: formData.get("status") as SeriesStatus,
        publishing,
        totalVolumes: formData.get("totalVolumes")
          ? parseInt(formData.get("totalVolumes") as string)
          : undefined,
        retailPrice: formData.get("retailPrice")
          ? parseFloat(formData.get("retailPrice") as string)
          : undefined,
        coverImage: (formData.get("coverImage") as string) || undefined,
        description: (formData.get("description") as string) || undefined,
      });
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update series");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteSeries(series.id);
      router.push("/dashboard/series");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete series");
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                type="text"
                required
                defaultValue={series.title}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  name="author"
                  type="text"
                  defaultValue={series.author || ""}
                />
              </div>
              <div>
                <Label htmlFor="editorial">Editorial</Label>
                <Select
                  id="editorial"
                  name="editorial"
                  defaultValue={series.editorial || ""}
                >
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
                  name="totalVolumes"
                  type="number"
                  min="1"
                  defaultValue={series.totalVolumes || ""}
                />
              </div>
              <div>
                <Label htmlFor="retailPrice">Retail Price (EUR)</Label>
                <Input
                  id="retailPrice"
                  name="retailPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={series.retailPrice || ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Reading Status</Label>
                <Select
                  id="status"
                  name="status"
                  defaultValue={series.status}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex items-end pb-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={publishing}
                      onChange={(e) => setPublishing(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-10 h-6 bg-background-tertiary border border-border rounded-full transition-colors peer-checked:bg-accent peer-checked:border-accent"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:left-5"></div>
                  </div>
                  <span className="text-sm font-medium text-foreground-muted group-hover:text-foreground transition-colors">
                    Still Publishing
                  </span>
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                name="coverImage"
                type="url"
                defaultValue={series.coverImage || ""}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={series.description || ""}
              />
            </div>

            {error && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
                {error}
              </div>
            )}

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
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
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
