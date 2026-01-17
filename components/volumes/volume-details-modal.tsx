"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateVolume, type UpdateVolumeInput } from "@/actions/volumes";
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
import type { Volume } from "@/lib/generated/prisma/browser";
import Image from "next/image";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { volumeSchema, type VolumeSchema } from "@/lib/validations";
import { toast } from "sonner";

const storeOptions = [
  { value: Store.AMAZON, label: "Amazon" },
  { value: Store.VINTED, label: "Vinted" },
  { value: Store.WALLAPOP, label: "Wallapop" },
  { value: Store.ABACUS, label: "Abacus" },
  { value: Store.CASA_DEL_LIBRO, label: "Casa del Libro" },
  { value: Store.NA, label: "N/A" },
];

const conditionOptions = [
  { value: Condition.NEW, label: "New" },
  { value: Condition.LIKE_NEW, label: "Like New" },
  { value: Condition.VERY_GOOD, label: "Very Good" },
  { value: Condition.GOOD, label: "Good" },
  { value: Condition.ACCEPTABLE, label: "Acceptable" },
  { value: Condition.POOR, label: "Poor" },
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

export function VolumeDetailsModal({
  volume,
  seriesDefaults,
  isOpen,
  onClose,
}: VolumeDetailsModalProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VolumeSchema>({
    resolver: zodResolver(volumeSchema),
    defaultValues: {
      volumeNumber: volume.volumeNumber,
      title: volume.title || "",
      owned: volume.owned,
      read: volume.read,
      pricePaid:
        Number(volume.pricePaid?.toFixed(2)) || seriesDefaults?.retailPrice,
      store: volume.store,
      coverImage: volume.coverImage || "",
      condition: volume.condition,
      notes: volume.notes || "",
      purchaseDate: volume.purchaseDate ? new Date(volume.purchaseDate) : null,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        volumeNumber: volume.volumeNumber,
        title: volume.title || "",
        owned: volume.owned,
        read: volume.read,
        pricePaid:
          Number(volume.pricePaid?.toFixed(2)) || seriesDefaults?.retailPrice,
        store: volume.store,
        coverImage: volume.coverImage || "",
        condition: volume.condition,
        notes: volume.notes || "",
        purchaseDate: volume.purchaseDate
          ? new Date(volume.purchaseDate)
          : null,
      });
    }
  }, [isOpen, volume, seriesDefaults, reset]);

  const onSubmit: SubmitHandler<VolumeSchema> = async (data) => {
    try {
      const input: UpdateVolumeInput = {
        volumeNumber: data.volumeNumber,
        owned: true,
        read: data.read,
        pricePaid: Number(data.pricePaid?.toFixed(2)) ?? undefined,
        condition: data.condition,
        store: data.store || undefined,
        coverImage: data.coverImage || undefined,
        purchaseDate: data.purchaseDate || undefined,
        readDate: data.readDate || undefined,
        notes: data.notes || undefined,
      };

      await updateVolume(volume.id, input);
      toast.success(`Volume ${volume.volumeNumber} updated`);
      window.dispatchEvent(new CustomEvent("stats-update"));
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update volume",
      );
    }
  };

  const handleRemoveOwned = async () => {
    try {
      const input: UpdateVolumeInput = {
        owned: false,
        read: false,
        pricePaid: undefined,
        store: undefined,
        coverImage: undefined,
        purchaseDate: undefined,
        readDate: undefined,
      };

      await updateVolume(volume.id, input);
      toast.success(`Volume ${volume.volumeNumber} removed from collection`);
      window.dispatchEvent(new CustomEvent("stats-update"));
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove volume",
      );
    }
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const coverImage = watch("coverImage");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Volume ${volume.volumeNumber}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div
            className={`
              w-14 h-20 rounded-lg overflow-hidden shrink-0
              flex items-center justify-center
              ${
                coverImage
                  ? ""
                  : "bg-linear-to-br from-accent/20 to-accent/5 border border-accent/20"
              }
            `}
          >
            {coverImage ? (
              <Image
                width={144}
                height={192}
                src={coverImage}
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
                <Badge
                  variant={volume.read ? "success" : "default"}
                  className="gap-1.5"
                >
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

        <div className="space-y-4">
          <div>
            <Label htmlFor="coverImage">Cover Image URL</Label>
            <Input
              id="coverImage"
              type="url"
              {...register("coverImage")}
              placeholder="https://..."
              icon={<ImageIcon className="w-4 h-4" />}
            />
            {errors.coverImage && (
              <p className="text-xs text-error mt-1">
                {errors.coverImage.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pricePaid">Price Paid (€)</Label>
              <Input
                id="pricePaid"
                type="number"
                step="0.01"
                min="0"
                {...register("pricePaid", { valueAsNumber: true })}
                placeholder="9.95"
                icon={<Euro className="w-4 h-4" />}
              />
            </div>
            <div>
              <Label htmlFor="store">Store</Label>
              <Select id="store" {...register("store")}>
                <option value="">Select store...</option>
                {storeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select id="condition" {...register("condition")}>
                {conditionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                {...register("purchaseDate", { valueAsDate: true })}
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
              {...register("notes")}
              rows={2}
              placeholder="Any notes about this volume..."
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          {volume.owned && (
            <Button
              variant="destructive"
              type="button"
              onClick={handleRemoveOwned}
              disabled={isSubmitting}
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
            disabled={isSubmitting}
            className="flex-1 gap-2"
          >
            {isSubmitting ? (
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
