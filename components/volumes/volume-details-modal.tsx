"use client";

import { createStore } from "@/actions/stores";
import {
  toggleVolumeRead,
  updateVolume,
  type UpdateVolumeInput,
} from "@/actions/volumes";
import { toggleWishlist } from "@/actions/wishlist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreatableSelect } from "@/components/ui/creatable-select";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { conditionOptions } from "@/lib/constants";
import type { Volume } from "@/lib/generated/prisma/browser";
import { volumeSchema, type VolumeSchema } from "@/lib/validations";
import type { SeriesDefaults } from "@/types";
import { formatDateForInput } from "@/utils/date";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  Check,
  Euro,
  Heart,
  ImageIcon,
  Loader2,
  Package,
  Sparkles,
  StickyNote,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

type UserStore = { id: string; name: string };

type VolumeDetailsModalProps = {
  volume: Volume;
  seriesDefaults?: SeriesDefaults;
  stores?: UserStore[];
  isOpen: boolean;
  onClose: () => void;
};

export function VolumeDetailsModal({
  volume,
  seriesDefaults,
  stores = [],
  isOpen,
  onClose,
}: VolumeDetailsModalProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VolumeSchema>({
    resolver: zodResolver(volumeSchema),
    defaultValues: {
      volumeNumber: volume.volumeNumber,
      title: volume.title || "",
      owned: volume.owned,
      read: volume.read,
      pricePaid:
        volume.pricePaid !== null && volume.pricePaid !== undefined
          ? Number(volume.pricePaid?.toFixed(2))
          : seriesDefaults?.retailPrice,
      storeId: volume.storeId ?? "",
      coverImage: volume.coverImage || "",
      condition: volume.condition ?? "NEW",
      notes: volume.notes || "",
      purchaseDate: (volume.owned
        ? formatDateForInput(volume.purchaseDate)
        : new Date().toISOString().split("T")[0]) as unknown as Date,
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
          volume.pricePaid !== null && volume.pricePaid !== undefined
            ? Number(volume.pricePaid?.toFixed(2))
            : seriesDefaults?.retailPrice,
        storeId: volume.storeId ?? "",
        coverImage: volume.coverImage || "",
        condition: volume.condition ?? "NEW",
        notes: volume.notes || "",
        purchaseDate: (volume.owned
          ? formatDateForInput(volume.purchaseDate)
          : new Date().toISOString().split("T")[0]) as unknown as Date,
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
        storeId: data.storeId || null,
        coverImage: data.coverImage || undefined,
        purchaseDate: data.purchaseDate || undefined,
        readDate: data.readDate || undefined,
        notes: data.notes || undefined,
      };

      await updateVolume(volume.id, input);
      toast.success(`Volume ${volume.volumeNumber} updated`);
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
        pricePaid: null,
        condition: null,
        storeId: null,
        purchaseDate: null,
        readDate: null,
      };

      await updateVolume(volume.id, input);
      toast.success(`Volume ${volume.volumeNumber} removed from collection`);
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove volume",
      );
    }
  };

  const handleToggleRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await toggleVolumeRead(volume.id);
      toast.success(`Volume ${volume.volumeNumber} updated`);
      router.refresh();
      onClose();
    } catch {
      toast.error("Failed to update volume");
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await toggleWishlist(volume.id);
      toast.success(
        volume.wishlist
          ? `Volume ${volume.volumeNumber} removed from wishlist`
          : `Volume ${volume.volumeNumber} added to wishlist`,
      );
      router.refresh();
      onClose();
    } catch {
      toast.error("Failed to update wishlist");
    }
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const coverImage = watch("coverImage");
  const storeId = watch("storeId");

  const isOwned = volume.owned;
  const isRead = volume.read;
  const isWishlisted = volume.wishlist && !isOwned;

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
            <div className="flex items-center gap-2">
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

            <div className="mt-2">
              {isOwned && (
                <Button
                  size="sm"
                  onClick={handleToggleRead}
                  variant={isRead ? "success" : "secondary"}
                  className="rounded-md"
                  aria-label={`Mark volume ${volume.volumeNumber} as ${isRead ? "unread" : "read"}`}
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark as {isRead ? "unread" : "read"}
                </Button>
              )}

              {!volume.owned && (
                <Button
                  size="sm"
                  onClick={handleToggleWishlist}
                  variant="secondary"
                  className={`rounded-md ${isWishlisted ? "bg-error text-white hover:bg-error/90" : ""}`}
                  aria-label={`${isWishlisted ? "Remove" : "Add"} volume ${volume.volumeNumber} ${isWishlisted ? "from" : "to"} wishlist`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${isWishlisted ? "fill-current" : ""}`}
                  />
                  {isWishlisted ? "Remove" : "Add"}{" "}
                  {isWishlisted ? "from" : "to"} wishlist
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <FormField
            label="Cover Image URL"
            htmlFor="coverImage"
            error={errors.coverImage?.message}
          >
            <Input
              id="coverImage"
              type="url"
              {...register("coverImage")}
              placeholder="https://..."
              icon={<ImageIcon className="w-4 h-4" />}
              error={!!errors.coverImage}
            />
          </FormField>

          <FormSection columns={2}>
            <FormField
              label="Price Paid"
              htmlFor="pricePaid"
              error={errors.pricePaid?.message}
              required
            >
              <Input
                id="pricePaid"
                type="number"
                step="0.01"
                min="0"
                {...register("pricePaid", { valueAsNumber: true })}
                placeholder="9.95"
                icon={<Euro className="w-4 h-4" />}
                error={!!errors.pricePaid}
              />
            </FormField>
            <FormField
              label="Store"
              htmlFor="storeId"
              error={errors.storeId?.message}
            >
              <CreatableSelect
                id="storeId"
                options={stores.map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
                value={storeId ?? ""}
                onChange={(val) => setValue("storeId", val || null)}
                onCreate={async (name) => {
                  try {
                    const store = await createStore(name);
                    toast.success(`Store "${store.name}" created`);
                    router.refresh();
                    return store;
                  } catch (err) {
                    toast.error(
                      err instanceof Error
                        ? err.message
                        : "Failed to create store",
                    );
                    throw err;
                  }
                }}
                placeholder="No store"
                createLabel="Add new store..."
                error={!!errors.storeId}
              />
            </FormField>
          </FormSection>

          <FormSection columns={2}>
            <FormField
              label="Condition"
              htmlFor="condition"
              error={errors.condition?.message}
              required
            >
              <Select
                id="condition"
                {...register("condition")}
                error={!!errors.condition}
              >
                {conditionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label="Purchase Date"
              htmlFor="purchaseDate"
              error={errors.purchaseDate?.message}
              required
            >
              <Input
                id="purchaseDate"
                type="date"
                {...register("purchaseDate", {
                  setValueAs: (v: string) => (v ? new Date(v) : null),
                })}
                icon={<Calendar className="w-4 h-4" />}
                error={!!errors.purchaseDate}
              />
            </FormField>
          </FormSection>

          <FormField
            label="Notes"
            htmlFor="notes"
            error={errors.notes?.message}
          >
            <Textarea
              id="notes"
              {...register("notes")}
              rows={2}
              placeholder="Any notes about this volume..."
              icon={<StickyNote className="w-4 h-4" />}
              error={!!errors.notes}
            />
          </FormField>
        </div>

        <div className="flex gap-3 pt-2">
          {volume.owned && (
            <Button
              variant="destructive"
              type="button"
              onClick={handleRemoveOwned}
              disabled={isSubmitting}
              className="px-3"
              aria-label="Remove from collection"
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
