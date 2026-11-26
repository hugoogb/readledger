"use client";

import { bulkMarkOwned } from "@/actions/volumes";
import { Button } from "@/components/ui/button";
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
import { useFormatCurrency } from "@/components/providers/currency-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  Check,
  Banknote,
  Package,
  StickyNote,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { parseDateInput, todayInputValue } from "@/utils/date";
import { unwrap } from "@/lib/unwrap";
import { errorMessage } from "@/lib/utils";
import { StoreSelect } from "./store-select";
import { VolumePicker } from "./volume-picker";

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
  const formatCurrency = useFormatCurrency();
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
      purchaseDate: todayInputValue(),
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
      unwrap(await bulkMarkOwned(ids, {
        pricePaid: Number.isFinite(data.totalPrice)
          ? roundToTwo(data.totalPrice / ids.length)
          : undefined,
        storeId: data.storeId || undefined,
        condition: data.condition,
        purchaseDate: parseDateInput(data.purchaseDate) ?? undefined,
        notes: data.notes || undefined,
      }));
      toast.success(`${ids.length} volumes marked as owned`);
      router.refresh();
      handleOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update volumes"));
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
          <VolumePicker
            label="Select Volumes"
            volumes={unownedVolumes}
            isSelected={has}
            selectedCount={selectedCount}
            onToggle={toggle}
            onSelectAll={() => selectAll(unownedVolumes.map((v) => v.id))}
            onClear={clear}
            emptyText="All volumes are already owned!"
            tone="accent"
          />

          <FormField
            label="Total Price Paid"
            htmlFor="totalPrice"
            error={errors.totalPrice?.message}
            required
          >
            <Input
              id="totalPrice"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              {...register("totalPrice", { valueAsNumber: true })}
              placeholder="Enter total amount..."
              icon={<Banknote className="w-4 h-4" />}
              error={!!errors.totalPrice}
            />
            {selectedCount > 0 && !isNaN(totalPrice) && (
              <div className="mt-2 flex items-center gap-2 text-sm">
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

          <FormSection columns={2}>
            <FormField
              label="Store"
              htmlFor="storeId"
              error={errors.storeId?.message}
            >
              <StoreSelect
                stores={stores}
                value={storeId ?? ""}
                onChange={(val) => setValue("storeId", val || "")}
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
