"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatChartMonth, formatChartMonthShort } from "@/utils/date";
import { BookMarked } from "lucide-react";
import { ChartEmpty } from "./chart-empty";

type ReadsPerPeriodProps = {
  /** `label` is "YYYY-MM" for months or "YYYY" for years. */
  data: { label: string; count: number }[];
  granularity: "month" | "year";
};

export function ReadsPerPeriod({ data, granularity }: ReadsPerPeriodProps) {
  if (data.every((d) => d.count === 0)) {
    return <ChartEmpty label="reading data" icon={BookMarked} />;
  }

  const isMonth = granularity === "month";

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ left: -20, right: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--color-foreground-muted)", fontSize: 12 }}
          tickLine={false}
          // Month initials keep all twelve labels readable at phone width.
          tickFormatter={(v: string) =>
            isMonth ? formatChartMonthShort(v).charAt(0) : v
          }
          interval={0}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "var(--color-foreground-muted)", fontSize: 12 }}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--color-background-tertiary)", opacity: 0.5 }}
          contentStyle={{
            backgroundColor: "var(--color-background-secondary)",
            border: "1px solid var(--color-border)",
            borderRadius: "0.75rem",
            color: "var(--color-foreground)",
          }}
          labelFormatter={(label) => (isMonth ? formatChartMonth(String(label)) : String(label))}
          formatter={(value) => [
            `${value} volume${Number(value) !== 1 ? "s" : ""}`,
            "Read",
          ]}
        />
        <Bar dataKey="count" fill="var(--color-success)" radius={[4, 4, 0, 0]} name="Read" />
      </BarChart>
    </ResponsiveContainer>
  );
}
