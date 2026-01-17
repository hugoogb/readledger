"use client";

import { useState } from "react";
import { createSeries, createSeriesWithVolumes } from "@/actions/series";
import { Loader2, Plus, Search, Edit3, BookOpen } from "lucide-react";
import { SeriesStatus, Editorial } from "@/lib/generated/prisma/enums";
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

type FormData = {
  title: string;
  author: string;
  editorial: string;
  totalVolumes: string;
  retailPrice: string;
  coverImage: string;
  description: string;
  status: SeriesStatus;
  publishing: boolean;
  malId: number | null;
};

const initialFormData: FormData = {
  title: "",
  author: "",
  editorial: "",
  totalVolumes: "",
  retailPrice: "",
  coverImage: "",
  description: "",
  status: "READING",
  publishing: false,
  malId: null,
};

export function AddSeriesModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(true);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when closing
      setShowSearch(true);
      setFormData(initialFormData);
      setError(null);
    }
  };

  const handleSearchSelect = (data: FormattedMangaData) => {
    setFormData({
      title: data.title || "",
      author: data.author || "",
      editorial: "",
      totalVolumes: data.totalVolumes?.toString() || "",
      retailPrice: "",
      coverImage: data.coverImage || "",
      description: data.description || "",
      status: "READING",
      publishing: data.publishing,
      malId: data.malId,
    });
    setShowSearch(false);
  };

  const handleManualEntry = () => {
    setShowSearch(false);
  };

  const handleBackToSearch = () => {
    setShowSearch(true);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const totalVols = formData.totalVolumes
        ? parseInt(formData.totalVolumes)
        : 0;

      const seriesData = {
        title: formData.title,
        author: formData.author || undefined,
        editorial: (formData.editorial as Editorial) || undefined,
        status: formData.status,
        publishing: formData.publishing,
        totalVolumes: totalVols || undefined,
        retailPrice: formData.retailPrice
          ? parseFloat(formData.retailPrice)
          : undefined,
        coverImage: formData.coverImage || undefined,
        description: formData.description || undefined,
        malId: formData.malId || undefined,
      };

      // Always create all volume entries when totalVolumes is known
      if (totalVols > 0) {
        const volumes = generateVolumeEntries(totalVols);
        await createSeriesWithVolumes(seriesData, volumes);
      } else {
        await createSeries(seriesData);
      }

      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create series");
    } finally {
      setIsLoading(false);
    }
  }

  const totalVolumesNum = formData.totalVolumes
    ? parseInt(formData.totalVolumes)
    : 0;

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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Back button */}
            <Button
              variant="link"
              type="button"
              onClick={handleBackToSearch}
              className="h-auto p-0 gap-1 text-sm"
            >
              <Search className="w-4 h-4" />
              Search again
            </Button>

            {/* Cover Preview */}
            {formData.coverImage && (
              <div className="flex justify-center">
                <Image
                  width={96}
                  height={128}
                  src={formData.coverImage}
                  alt="Cover preview"
                  className="rounded-xl object-cover shadow-lg"
                />
              </div>
            )}

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="One Piece"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  name="author"
                  type="text"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  placeholder="Eiichiro Oda"
                />
              </div>

              <div>
                <Label htmlFor="editorial">Editorial</Label>
                <Select
                  id="editorial"
                  name="editorial"
                  value={formData.editorial}
                  onChange={(e) =>
                    setFormData({ ...formData, editorial: e.target.value })
                  }
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
                  value={formData.totalVolumes}
                  onChange={(e) =>
                    setFormData({ ...formData, totalVolumes: e.target.value })
                  }
                  placeholder="109"
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
                  value={formData.retailPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, retailPrice: e.target.value })
                  }
                  placeholder="9.95"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Reading Status</Label>
                <Select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as SeriesStatus,
                    })
                  }
                >
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
                      checked={formData.publishing}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          publishing: e.target.checked,
                        })
                      }
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

            {/* Volume info notice */}
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
                name="coverImage"
                type="url"
                value={formData.coverImage}
                onChange={(e) =>
                  setFormData({ ...formData, coverImage: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description..."
              />
            </div>

            {error && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
                {error}
              </div>
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
                disabled={isLoading}
                className="flex-1 gap-2"
              >
                {isLoading ? (
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
