import { Condition, SeriesStatus } from "./generated/prisma/enums";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive" | "success" | "warning";

export const statusConfig: Record<SeriesStatus, { label: string; variant: BadgeVariant }> = {
  READING: { label: "Reading", variant: "default" },
  COMPLETED: { label: "Completed", variant: "success" },
  ON_HOLD: { label: "On Hold", variant: "warning" },
  DROPPED: { label: "Dropped", variant: "destructive" },
  PLAN_TO_READ: { label: "Plan to Read", variant: "secondary" },
};

export const statusOptions = Object.values(SeriesStatus).map((value) => ({
  value,
  label: statusConfig[value].label,
}));

export const conditionLabels: Record<Condition, string> = {
  NEW: "New",
  LIKE_NEW: "Like New",
  VERY_GOOD: "Very Good",
  GOOD: "Good",
  ACCEPTABLE: "Acceptable",
  POOR: "Poor",
};

export const conditionOptions = Object.values(Condition).map((value) => ({
  value,
  label: conditionLabels[value],
}));
