"use client";

import { useState, useEffect, } from "react";
import { useRouter } from "next/navigation";
import { updateVolume } from "@/actions/volumes";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Package,
  Trash2,
  Euro,
  Calendar,
  Sparkles,
  StickyNote,
  ImageIcon,
} from "lucide-react";
import { Condition, Store } from "@/lib/generated/prisma/enums";
import { Volume } from "@/lib/generated/prisma/client";
import Image from "next/image";

const storeOptions = [
  { value: "AMAZON", label: "Amazon" },
  { value: "VINTED", label: "Vinted" },
  { value: "WALLAPOP", label: "Wallapop" },
  { value: "ABACUS", label: "Abacus" },
  { value: "CASA_DEL_LIBRO", label: "Casa del Libro" },
  { value: "NA", label: "N/A" },
];

const conditionOptions = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "VERY_GOOD", label: "Very Good" },
  { value: "GOOD", label: "Good" },
  { value: "ACCEPTABLE", label: "Acceptable" },
  { value: "POOR", label: "Poor" },
];

type SeriesDefaults = {
  retailPrice?: number | null;
};

type VolumeDetailsModalProps = {
  volume: Volume;
  seriesDefaults?: SeriesDefaults;
  isOpen: boolean;
  onClose: () => void;
};

function getInitialFormData(volume: Volume, seriesDefaults?: SeriesDefaults) {
  if (volume.owned) {
    return {
      coverImage: volume.coverImage || "",
      pricePaid: volume.pricePaid?.toString() || "",
      store: volume.store || "",
      condition: volume.condition || "NEW",
      purchaseDate: volume.purchaseDate
        ? new Date(volume.purchaseDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      notes: volume.notes || "",
    };
  } else {
    return {
      coverImage: "",
      pricePaid: seriesDefaults?.retailPrice?.toString() || "",
      store: "",
      condition: "NEW",
      purchaseDate: new Date().toISOString().split("T")[0],
      notes: "",
    };
  }
}

export function VolumeDetailsModal({
  volume,
  seriesDefaults,
  isOpen,
  onClose,
}: VolumeDetailsModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(() =>
    getInitialFormData(volume, seriesDefaults),
  );

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData(volume, seriesDefaults));
      setError(null);
    }
  }, [isOpen, volume, seriesDefaults]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await updateVolume(volume.id, {
        owned: true,
        coverImage: formData.coverImage || undefined,
        pricePaid: formData.pricePaid
          ? parseFloat(formData.pricePaid)
          : undefined,
        store: (formData.store as Store) || undefined,
        condition: formData.condition as Condition,
        purchaseDate: formData.purchaseDate
          ? new Date(formData.purchaseDate)
          : new Date(),
        notes: formData.notes || undefined,
      });
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update volume");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveOwned = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await updateVolume(volume.id, {
        owned: false,
        read: false,
        pricePaid: undefined,
        store: undefined,
        purchaseDate: undefined,
        readDate: undefined,
      });
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update volume");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Volume ${volume.volumeNumber}`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Volume Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div
            className={`
              w-14 h-20 rounded-lg overflow-hidden shrink-0
              flex items-center justify-center
              ${formData.coverImage
                ? ""
                : "bg-linear-to-br from-accent/20 to-accent/5 border border-accent/20"
              }
            `}
          >
            {formData.coverImage ? (
              <Image
                width={144}
                height={192}
                src={formData.coverImage}
                alt={`Volume ${volume.volumeNumber}`}
                className="object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-accent">
                {volume.volumeNumber}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground">
              Volume {volume.volumeNumber}
            </h3>
            <div className="mt-1">
              {volume.owned ? (
                <Badge variant={volume.read ? "success" : "default"} className="gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  {volume.read ? "Already read" : "In your collection"}
                </Badge>
              ) : (
                <p className="text-sm text-foreground-muted">
                  Add to your collection
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="coverImage">Cover Image URL</Label>
            <Input
              id="coverImage"
              type="url"
              value={formData.coverImage}
              onChange={(e) =>
                setFormData({ ...formData, coverImage: e.target.value })
              }
              placeholder="https://..."
              icon={<ImageIcon className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pricePaid">Price Paid (€)</Label>
              <Input
                id="pricePaid"
                type="number"
                step="0.01"
                min="0"
                value={formData.pricePaid}
                onChange={(e) =>
                  setFormData({ ...formData, pricePaid: e.target.value })
                }
                placeholder="9.95"
                icon={<Euro className="w-4 h-4" />}
              />
            </div>
            <div>
              <Label htmlFor="store">Store</Label>
              <Select
                id="store"
                value={formData.store}
                onChange={(e) => setFormData({ ...formData, store: e.target.value })}
              >
                <option value="">Select store...</option>
                {storeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select
                id="condition"
                value={formData.condition}
                onChange={(e) =>
                  setFormData({ ...formData, condition: e.target.value })
                }
              >
                {conditionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) =>
                  setFormData({ ...formData, purchaseDate: e.target.value })
                }
                icon={<Calendar className="w-4 h-4" />}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="flex items-center gap-2">
              <StickyNote className="w-4 h-4" />
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
              placeholder="Any notes about this volume..."
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {volume.owned && (
            <Button
              variant="destructive"
              type="button"
              onClick={handleRemoveOwned}
              disabled={isLoading}
              className="px-3"
              title="Remove from collection"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
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
              <>
                {volume.owned ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    Add to Collection
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
