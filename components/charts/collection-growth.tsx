"use client";

import {
  Bar,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatChartMonth, formatChartMonthShort } from "@/utils/date";

type CollectionGrowthProps = {
  data: { month: string; added: number; total: number }[];
};

export function CollectionGrowth({ data }: CollectionGrowthProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-foreground-muted text-center py-8">
        No collection data yet
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="month"
          tick={{ fill: "var(--color-foreground-muted)", fontSize: 12 }}
          tickLine={false}
          tickFormatter={formatChartMonthShort}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: "var(--color-foreground-muted)", fontSize: 12 }}
          tickLine={false}
          label={{
            value: "Added",
            angle: -90,
            position: "insideLeft",
            fill: "var(--color-foreground-muted)",
            fontSize: 11,
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: "var(--color-foreground-muted)", fontSize: 12 }}
          tickLine={false}
          label={{
            value: "Total",
            angle: 90,
            position: "insideRight",
            fill: "var(--color-foreground-muted)",
            fontSize: 11,
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-background-secondary)",
            border: "1px solid var(--color-border)",
            borderRadius: "0.75rem",
            color: "var(--color-foreground)",
          }}
          labelFormatter={(label) => formatChartMonth(String(label))}
          formatter={(value, name) => [
            `${value} volume${Number(value) !== 1 ? "s" : ""}`,
            name === "added" ? "Added" : "Total",
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "var(--color-foreground-muted)" }}
        />
        <Bar
          yAxisId="left"
          dataKey="added"
          fill="var(--color-accent)"
          opacity={0.6}
          radius={[4, 4, 0, 0]}
          name="Added"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="total"
          stroke="var(--color-success)"
          strokeWidth={2}
          dot={false}
          name="Total"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
