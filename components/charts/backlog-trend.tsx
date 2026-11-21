"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatChartMonth, formatChartMonthShort } from "@/utils/date";
import { Layers } from "lucide-react";
import { ChartEmpty } from "./chart-empty";

type BacklogTrendProps = {
  /** `label` is "YYYY-MM" for months or "YYYY" for years. */
  data: { label: string; count: number }[];
  granularity: "month" | "year";
};

export function BacklogTrend({ data, granularity }: BacklogTrendProps) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return <ChartEmpty label="unread backlog" icon={Layers} />;
  }

  const isMonth = granularity === "month";

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ left: -20, right: 4 }}>
        <defs>
          <linearGradient id="backlogGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-chart-3)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--color-chart-3)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--color-foreground-muted)", fontSize: 12 }}
          tickLine={false}
          tickFormatter={(v: string) => (isMonth ? formatChartMonthShort(v) : v)}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "var(--color-foreground-muted)", fontSize: 12 }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-background-secondary)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            color: "var(--color-foreground)",
            boxShadow: "none",
          }}
          labelFormatter={(label) => (isMonth ? formatChartMonth(String(label)) : String(label))}
          formatter={(value) => [
            `${value} book${Number(value) !== 1 ? "s" : ""}`,
            "Unread",
          ]}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="var(--color-chart-3)"
          strokeWidth={2}
          fill="url(#backlogGradient)"
          name="Unread"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
