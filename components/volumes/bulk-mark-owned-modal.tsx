"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Package,
  Check,
  Euro,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Volume } from "@/lib/generated/prisma/client";
import { Condition, Store } from "@/lib/generated/prisma/enums";
import { updateVolume } from "@/actions/volumes";
import { formatCurrency } from "@/utils/currency";

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

type BulkMarkOwnedModalProps = {
  volumes: Volume[];
};

export function BulkMarkOwnedModal({ volumes }: BulkMarkOwnedModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unownedVolumes = volumes.filter((v) => !v.owned);

  const [selectedVolumeIds, setSelectedVolumeIds] = useState<Set<string>>(
    new Set(),
  );
  const [formData, setFormData] = useState({
    totalPrice: "",
    store: "",
    condition: "NEW",
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedVolumeIds(new Set());
      setFormData({
        totalPrice: "",
        store: "",
        condition: "NEW",
        purchaseDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setError(null);
    }
  };

  const toggleVolume = (volumeId: string) => {
    const newSet = new Set(selectedVolumeIds);
    if (newSet.has(volumeId)) {
      newSet.delete(volumeId);
    } else {
      newSet.add(volumeId);
    }
    setSelectedVolumeIds(newSet);
  };

  const selectAll = () => {
    setSelectedVolumeIds(new Set(unownedVolumes.map((v) => v.id)));
  };

  const deselectAll = () => {
    setSelectedVolumeIds(new Set());
  };

  const pricePerVolume =
    formData.totalPrice && selectedVolumeIds.size > 0
      ? parseFloat(formData.totalPrice) / selectedVolumeIds.size
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVolumeIds.size === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const promises = Array.from(selectedVolumeIds).map((volumeId) =>
        updateVolume(volumeId, {
          owned: true,
          pricePaid: pricePerVolume || undefined,
          store: (formData.store as Store) || undefined,
          condition: formData.condition as Condition,
          purchaseDate: formData.purchaseDate
            ? new Date(formData.purchaseDate)
            : new Date(),
          notes: formData.notes || undefined,
        }),
      );

      await Promise.all(promises);
      router.refresh();
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update volumes");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => handleOpenChange(true)}
        disabled={unownedVolumes.length === 0}
        className="gap-2"
      >
        <Package className="w-4 h-4" />
        Bulk Mark Owned
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => handleOpenChange(false)}
        title="Bulk Mark as Owned"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Volume Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="mb-0">
                Select Volumes
              </Label>
              <div className="flex items-center gap-3">
                <Badge variant="default" size="sm">
                  {selectedVolumeIds.size} selected
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="link"
                    type="button"
                    onClick={selectAll}
                    className="h-auto p-0 text-xs font-medium text-accent hover:text-accent-hover"
                  >
                    Select All
                  </Button>
                  <span className="text-foreground-muted/30">|</span>
                  <Button
                    variant="link"
                    type="button"
                    onClick={deselectAll}
                    className="h-auto p-0 text-xs font-medium text-foreground-muted hover:text-foreground"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto border border-border rounded-xl p-3 bg-background-tertiary/50">
              <div className="flex flex-wrap gap-2">
                {unownedVolumes.length > 0 ? (
                  unownedVolumes.map((volume) => (
                    <Button
                      key={volume.id}
                      type="button"
                      variant={selectedVolumeIds.has(volume.id) ? "default" : "outline"}
                      onClick={() => toggleVolume(volume.id)}
                      className={`
                        min-w-[40px] h-10 px-0 rounded-lg text-sm font-semibold
                        ${selectedVolumeIds.has(volume.id)
                          ? "ring-2 ring-accent ring-offset-2 ring-offset-background-tertiary shadow-lg"
                          : "hover:border-accent/50 hover:bg-accent/5"
                        }
                      `}
                    >
                      {volume.volumeNumber}
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-foreground-muted py-2">
                    🎉 All volumes are already owned!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Total Price with calculation preview */}
          <div>
            <Label htmlFor="totalPrice">Total Price Paid (€)</Label>
            <Input
              id="totalPrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.totalPrice}
              onChange={(e) =>
                setFormData({ ...formData, totalPrice: e.target.value })
              }
              placeholder="Enter total amount..."
              icon={<Euro className="w-4 h-4" />}
            />
            {selectedVolumeIds.size > 0 && formData.totalPrice && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-foreground-muted">
                  ={" "}
                  <span className="font-semibold text-accent">
                    {formatCurrency(pricePerVolume)}
                  </span>{" "}
                  per volume
                </span>
              </div>
            )}
          </div>

          {/* Store and Condition */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Purchase Date */}
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

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
              placeholder="Any notes about this purchase..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Actions */}
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
              disabled={isLoading || selectedVolumeIds.size === 0}
              className="flex-1 gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Mark {selectedVolumeIds.size} as Owned
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
