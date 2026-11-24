"use client";

import { Package } from "lucide-react";
import { conditionLabels } from "@/lib/constants";
import type { Condition } from "@/lib/generated/prisma/enums";
import { DonutChart } from "./donut-chart";

const COLORS: Record<Condition, string> = {
  NEW: "var(--color-chart-1)",
  LIKE_NEW: "var(--color-success)",
  VERY_GOOD: "var(--color-accent-hover)",
  GOOD: "var(--color-warning)",
  ACCEPTABLE: "var(--color-error)",
  POOR: "var(--color-foreground-muted)",
};

const CONFIG = Object.fromEntries(
  (Object.keys(COLORS) as Condition[]).map((c) => [c, { label: conditionLabels[c], color: COLORS[c] }]),
);

export function ConditionDistribution({ data }: { data: { condition: Condition; count: number }[] }) {
  return (
    <DonutChart
      data={data.map((d) => ({ key: d.condition, count: d.count }))}
      config={CONFIG}
      unit="book"
      percentColor="var(--color-foreground-muted)"
      emptyLabel="condition data"
      emptyIcon={Package}
    />
  );
}
