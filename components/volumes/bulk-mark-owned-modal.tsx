"use client";

import { createStore } from "@/actions/stores";
import { bulkMarkOwned } from "@/actions/volumes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreatableSelect } from "@/components/ui/creatable-select";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToggleSet } from "@/hooks/use-toggle-set";
import { conditionOptions } from "@/lib/constants";
import type { Volume } from "@/lib/generated/prisma/browser";
import { Condition } from "@/lib/generated/prisma/enums";
import {
  bulkMarkOwnedSchema,
  type BulkMarkOwnedSchema,
} from "@/lib/validations";
import { formatCurrency } from "@/utils/currency";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  Check,
  Euro,
  Package,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

type UserStore = { id: string; name: string };

type BulkMarkOwnedModalProps = {
  volumes: Volume[];
  stores?: UserStore[];
};

const roundToTwo = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function BulkMarkOwnedModal({
  volumes,
  stores = [],
}: BulkMarkOwnedModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const unownedVolumes = volumes.filter((v) => !v.owned);
  const {
    set: selectedIds,
    toggle,
    selectAll,
    clear,
    size: selectedCount,
    has,
  } = useToggleSet<string>();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BulkMarkOwnedSchema>({
    resolver: zodResolver(bulkMarkOwnedSchema),
    defaultValues: {
      totalPrice: undefined,
      storeId: "",
      condition: Condition.NEW,
      purchaseDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      clear();
      reset();
    }
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const totalPrice = watch("totalPrice");
  const storeId = watch("storeId");
  const pricePerVolume =
    totalPrice && totalPrice > 0 && selectedCount > 0
      ? roundToTwo(totalPrice / selectedCount)
      : 0;

  const onSubmit: SubmitHandler<BulkMarkOwnedSchema> = async (data) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      await bulkMarkOwned(ids, {
        pricePaid: pricePerVolume || undefined,
        storeId: data.storeId || undefined,
        condition: data.condition,
        purchaseDate: data.purchaseDate
          ? new Date(data.purchaseDate)
          : new Date(),
        notes: data.notes || undefined,
      });
      toast.success(`${ids.length} volumes marked as owned`);
      router.refresh();
      handleOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update volumes",
      );
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Volume Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <FormField label="Select Volumes">
                <span />
              </FormField>
              <div className="flex items-center gap-3">
                <Badge variant="default" size="sm">
                  {selectedCount} selected
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="link"
                    type="button"
                    onClick={() => selectAll(unownedVolumes.map((v) => v.id))}
                    className="h-auto p-0 text-xs font-medium text-accent hover:text-accent-hover"
                  >
                    Select All
                  </Button>
                  <span className="text-foreground-muted/30">|</span>
                  <Button
                    variant="link"
                    type="button"
                    onClick={clear}
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
                      variant={has(volume.id) ? "default" : "outline"}
                      onClick={() => toggle(volume.id)}
                      className={`
                        min-w-10 h-10 px-0 rounded-lg text-sm font-semibold
                        ${
                          has(volume.id)
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
                    All volumes are already owned!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Total Price with calculation preview */}
          <FormField
            label="Total Price Paid"
            htmlFor="totalPrice"
            error={errors.totalPrice?.message}
            required
          >
            <Input
              id="totalPrice"
              type="number"
              step="0.01"
              min="0"
              {...register("totalPrice", { valueAsNumber: true })}
              placeholder="Enter total amount..."
              icon={<Euro className="w-4 h-4" />}
              error={!!errors.totalPrice}
            />
            {selectedCount > 0 && !isNaN(totalPrice) && (
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
          </FormField>

          {/* Store and Condition */}
          <FormSection columns={2}>
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
                onChange={(val) => setValue("storeId", val || "")}
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
          </FormSection>

          {/* Purchase Date */}
          <FormField
            label="Purchase Date"
            htmlFor="purchaseDate"
            error={errors.purchaseDate?.message}
            required
          >
            <Input
              id="purchaseDate"
              type="date"
              {...register("purchaseDate")}
              icon={<Calendar className="w-4 h-4" />}
              error={!!errors.purchaseDate}
            />
          </FormField>

          {/* Notes */}
          <FormField
            label="Notes"
            htmlFor="notes"
            error={errors.notes?.message}
          >
            <Textarea
              id="notes"
              {...register("notes")}
              rows={2}
              placeholder="Any notes about this purchase..."
              icon={<StickyNote className="w-4 h-4" />}
              error={!!errors.notes}
            />
          </FormField>

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
              loading={isSubmitting}
              disabled={selectedCount === 0}
              className="flex-1 gap-2"
            >
              {!isSubmitting && <Check className="w-4 h-4" />}
              Mark {selectedCount} as Owned
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
