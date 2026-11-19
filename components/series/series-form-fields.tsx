"use client";

import { createPublisher } from "@/actions/publishers";
import { Checkbox } from "@/components/ui/checkbox";
import { CreatableSelect } from "@/components/ui/creatable-select";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { statusOptions } from "@/lib/constants";
import { formatOptions } from "@/lib/format";
import type { SeriesSchema } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { unwrap } from "@/lib/unwrap";

type Publisher = { id: string; name: string };

type SeriesFormFieldsProps = {
  publishers?: Publisher[];
  /**
   * "single" hides the series-only fields (total volumes, still publishing);
   * the caller keeps totalVolumes at 1. Omitted = show everything.
   */
  kind?: "single" | "series";
  /** Rendered between Format and Title, e.g. the single/series switch. */
  afterFormat?: React.ReactNode;
};

export function SeriesFormFields({ publishers = [], kind = "series", afterFormat }: SeriesFormFieldsProps) {
  const isSingle = kind === "single";
  const router = useRouter();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<SeriesSchema>();

  const publishing = watch("publishing");
  const publisherId = watch("publisherId");

  return (
    <>
      <FormField label="Format" htmlFor="format" required error={errors.format?.message}>
        <Select id="format" {...register("format")} error={!!errors.format}>
          {formatOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </FormField>

      {afterFormat}

      <FormField
        label="Title"
        htmlFor="title"
        error={errors.title?.message}
        required
      >
        <Input
          id="title"
          type="text"
          {...register("title")}
          placeholder="Dune"
          error={!!errors.title}
        />
      </FormField>

      <FormSection columns={2}>
        <FormField
          label="Author"
          htmlFor="author"
          error={errors.author?.message}
        >
          <Input
            id="author"
            type="text"
            {...register("author")}
            placeholder="Frank Herbert"
            error={!!errors.author}
          />
        </FormField>

        <FormField
          label="Publisher"
          htmlFor="publisherId"
          error={errors.publisherId?.message}
        >
          <CreatableSelect
            id="publisherId"
            options={publishers.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
            value={publisherId ?? ""}
            onChange={(val) => setValue("publisherId", val || undefined)}
            onCreate={async (name) => {
              try {
                const pub = unwrap(await createPublisher(name));
                toast.success(`Publisher "${pub.name}" created`);
                router.refresh();
                return pub;
              } catch (err) {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "Failed to create publisher",
                );
                throw err;
              }
            }}
            placeholder="No publisher"
            createLabel="Add new publisher..."
            error={!!errors.publisherId}
          />
        </FormField>
      </FormSection>

      <FormSection columns={isSingle ? 1 : 2}>
        {!isSingle && (
        <FormField
          label="Total Volumes"
          htmlFor="totalVolumes"
          error={errors.totalVolumes?.message}
          required
        >
          <Input
            id="totalVolumes"
            type="number"
            inputMode="numeric"
            min="0"
            max="1000"
            {...register("totalVolumes", { valueAsNumber: true })}
            placeholder="12"
            error={!!errors.totalVolumes}
          />
        </FormField>
        )}

        <FormField
          label="Retail Price"
          htmlFor="retailPrice"
          error={errors.retailPrice?.message}
          required
        >
          <Input
            id="retailPrice"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            {...register("retailPrice", { valueAsNumber: true })}
            placeholder="9.95"
            error={!!errors.retailPrice}
          />
        </FormField>
      </FormSection>

      <FormSection columns={isSingle ? 1 : 2}>
        <FormField
          label="Reading Status"
          htmlFor="status"
          required
          error={errors.status?.message}
        >
          <Select id="status" {...register("status")} error={!!errors.status}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>

        {!isSingle && (
          <div className="flex items-end pb-1">
            <Checkbox
              checked={publishing}
              onChange={(checked) => setValue("publishing", checked)}
              label="Still Publishing"
            />
          </div>
        )}
      </FormSection>

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
          error={!!errors.coverImage}
        />
      </FormField>

      <FormField
        label="Description"
        htmlFor="description"
        error={errors.description?.message}
      >
        <Textarea
          id="description"
          rows={3}
          {...register("description")}
          placeholder="Brief description..."
          error={!!errors.description}
        />
      </FormField>
    </>
  );
}
