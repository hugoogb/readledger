import { Condition, SeriesStatus } from "./generated/prisma/enums";

export const statusOptions = [
  { value: SeriesStatus.READING, label: "Reading" },
  { value: SeriesStatus.COMPLETED, label: "Completed" },
  { value: SeriesStatus.ON_HOLD, label: "On Hold" },
  { value: SeriesStatus.DROPPED, label: "Dropped" },
  { value: SeriesStatus.PLAN_TO_READ, label: "Plan to Read" },
];

export const conditionOptions = [
  { value: Condition.NEW, label: "New" },
  { value: Condition.LIKE_NEW, label: "Like New" },
  { value: Condition.VERY_GOOD, label: "Very Good" },
  { value: Condition.GOOD, label: "Good" },
  { value: Condition.ACCEPTABLE, label: "Acceptable" },
  { value: Condition.POOR, label: "Poor" },
];

export const statusConfig: Record<
  string,
  {
    label: string;
    variant:
      | "default"
      | "secondary"
      | "outline"
      | "destructive"
      | "success"
      | "warning";
  }
> = {
  READING: { label: "Reading", variant: "default" },
  COMPLETED: { label: "Completed", variant: "success" },
  ON_HOLD: { label: "On Hold", variant: "warning" },
  DROPPED: { label: "Dropped", variant: "destructive" },
  PLAN_TO_READ: { label: "Plan to Read", variant: "secondary" },
};

export const conditionLabels: Record<string, string> = Object.fromEntries(
  conditionOptions.map(({ value, label }) => [value, label]),
);
