"use client";

import {
  updateVolume,
  type UpdateVolumeInput,
} from "@/actions/volumes";
import { toggleWishlist } from "@/actions/wishlist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { formatDateForInput, todayInputValue } from "@/utils/date";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Banknote,
  BookMarked,
  Calendar,
  Check,
  Heart,
  ImageIcon,
  Package,
  StickyNote,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { unwrap } from "@/lib/unwrap";
import { errorMessage } from "@/lib/utils";
import { StoreSelect } from "./store-select";

type UserStore = { id: string; name: string };

type VolumeDetailsModalProps = {
  volume: Volume;
  seriesDefaults?: SeriesDefaults;
  stores?: UserStore[];
  isOpen: boolean;
  onClose: () => void;
  focusField?: "readDate";
  label?: string;
};

function formValues(volume: Volume, seriesDefaults?: SeriesDefaults): VolumeSchema {
  return {
    volumeNumber: volume.volumeNumber,
    title: volume.title || "",
    owned: volume.owned,
    read: volume.read,
    pricePaid:
      volume.pricePaid != null ? Number(volume.pricePaid.toFixed(2)) : seriesDefaults?.retailPrice,
    storeId: volume.storeId ?? "",
    coverImage: volume.coverImage || "",
    condition: volume.condition ?? "NEW",
    notes: volume.notes || "",
    purchaseDate: (volume.owned
      ? formatDateForInput(volume.purchaseDate)
      : todayInputValue()) as unknown as Date,
  };
}

const readOnValue = (volume: Volume) =>
  volume.readDate ? formatDateForInput(volume.readDate) : volume.read ? todayInputValue() : "";

export function VolumeDetailsModal({
  volume,
  seriesDefaults,
  stores = [],
  isOpen,
  onClose,
  focusField,
  label,
}: VolumeDetailsModalProps) {
  const router = useRouter();
  const name = label ?? `Volume ${volume.volumeNumber}`;
  const [isActionPending, startAction] = useTransition();

  const [isReadChecked, setIsReadChecked] = useState(volume.read);
  const [readOn, setReadOn] = useState(() => readOnValue(volume));

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VolumeSchema>({
    resolver: zodResolver(volumeSchema),
    defaultValues: formValues(volume, seriesDefaults),
  });

  useEffect(() => {
    if (isOpen) {
      reset(formValues(volume, seriesDefaults));
      setIsReadChecked(volume.read);
      setReadOn(readOnValue(volume));
    }
  }, [isOpen, volume, seriesDefaults, reset]);

  const handleReadChange = (checked: boolean) => {
    setIsReadChecked(checked);
    if (checked && !readOn) setReadOn(todayInputValue());
  };

  const onSubmit: SubmitHandler<VolumeSchema> = async (data) => {
    try {
      const input: UpdateVolumeInput = {
        volumeNumber: data.volumeNumber,
        owned: true,
        read: isReadChecked,
        pricePaid: data.pricePaid == null ? null : Number(data.pricePaid.toFixed(2)),
        condition: data.condition,
        storeId: data.storeId || null,
        coverImage: data.coverImage ?? "",
        purchaseDate: data.purchaseDate || undefined,
        readDate: isReadChecked && readOn ? new Date(readOn) : undefined,
        notes: data.notes ?? "",
      };

      unwrap(await updateVolume(volume.id, input));
      toast.success(`${name} updated`);
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update volume"));
    }
  };

  const handleRemoveOwned = () => {
    startAction(async () => {
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

        unwrap(await updateVolume(volume.id, input));
        toast.success(`${name} removed from collection`);
        router.refresh();
        onClose();
      } catch (err) {
        toast.error(errorMessage(err, "Failed to remove volume"));
      }
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    startAction(async () => {
      try {
        unwrap(await toggleWishlist(volume.id));
        toast.success(
          volume.wishlist
            ? `${name} removed from wishlist`
            : `${name} added to wishlist`,
        );
        router.refresh();
        onClose();
      } catch {
        toast.error("Failed to update wishlist");
      }
    });
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const coverImage = watch("coverImage");
  const storeId = watch("storeId");

  const isOwned = volume.owned;
  const isWishlisted = volume.wishlist && !isOwned;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={name}
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
                  : "bg-accent-muted border border-accent/20"
              }
            `}
          >
            {coverImage ? (
              <Image
                width={144}
                height={192}
                src={coverImage}
                alt={name}
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
                {name}
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
              {!volume.owned && (
                <Button
                  size="sm"
                  onClick={handleToggleWishlist}
                  loading={isActionPending}
                  variant="secondary"
                  className={`rounded-md ${isWishlisted ? "bg-error text-accent-foreground hover:bg-error/90" : ""}`}
                  aria-label={`${isWishlisted ? "Remove" : "Add"} ${name} ${isWishlisted ? "from" : "to"} wishlist`}
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
                inputMode="decimal"
                step="0.01"
                min="0"
                {...register("pricePaid", { valueAsNumber: true })}
                placeholder="9.95"
                icon={<Banknote className="w-4 h-4" />}
                error={!!errors.pricePaid}
              />
            </FormField>
            <FormField
              label="Store"
              htmlFor="storeId"
              error={errors.storeId?.message}
            >
              <StoreSelect
                stores={stores}
                value={storeId ?? ""}
                onChange={(val) => setValue("storeId", val || null)}
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

          <div className="space-y-3">
            <Checkbox
              checked={isReadChecked}
              onChange={handleReadChange}
              label="Read"
              description="Track when you read this volume"
              variant="success"
            />
            {isReadChecked && (
              <FormField label="Read On" htmlFor="readDate">
                <Input
                  id="readDate"
                  type="date"
                  value={readOn}
                  onChange={(e) => setReadOn(e.target.value)}
                  icon={<BookMarked className="w-4 h-4" />}
                  autoFocus={focusField === "readDate"}
                />
              </FormField>
            )}
          </div>

          <FormField
            label="Notes"
            htmlFor="notes"
            error={errors.notes?.message}
          >
            <Textarea
              id="notes"
              {...register("notes")}
              rows={2}
              placeholder="Any notes about this copy..."
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
              loading={isActionPending}
              disabled={isSubmitting}
              className="px-3"
              aria-label="Remove from collection"
            >
              {!isActionPending && <Trash2 className="w-5 h-5" />}
            </Button>
          )}
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isActionPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isActionPending}
            className="flex-1 gap-2"
          >
            {!isSubmitting && (volume.owned ? <Check className="w-4 h-4" /> : <Package className="w-4 h-4" />)}
            {volume.owned ? "Save Changes" : "Add to Collection"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
