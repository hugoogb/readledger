"use client";

import { BookOpen } from "lucide-react";
import { statusConfig } from "@/lib/constants";
import type { SeriesStatus } from "@/lib/generated/prisma/enums";
import { DonutChart } from "./donut-chart";

const COLORS: Record<SeriesStatus, string> = {
  READING: "var(--color-chart-1)",
  COMPLETED: "var(--color-chart-2)",
  ON_HOLD: "var(--color-chart-4)",
  DROPPED: "var(--color-chart-3)",
  PLAN_TO_READ: "var(--color-chart-6)",
};

const CONFIG = Object.fromEntries(
  (Object.keys(COLORS) as SeriesStatus[]).map((s) => [s, { label: statusConfig[s].label, color: COLORS[s] }]),
);

export function StatusDistribution({ data }: { data: { status: SeriesStatus; count: number }[] }) {
  return (
    <DonutChart
      data={data.map((d) => ({ key: d.status, count: d.count }))}
      config={CONFIG}
      unit="title"
      percentColor="var(--color-chart-6)"
      emptyLabel="titles"
      emptyIcon={BookOpen}
    />
  );
}
