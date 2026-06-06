"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/utils/currency";
import { formatChartMonth, formatChartMonthShort } from "@/utils/date";
import { Wallet } from "lucide-react";
import { ChartEmpty } from "./chart-empty";

type SpendingOverTimeProps = {
  data: { month: string; amount: number; cumulative: number }[];
};

export function SpendingOverTime({ data }: SpendingOverTimeProps) {
  if (data.length === 0) {
    return <ChartEmpty label="spending data" icon={Wallet} />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="month"
          tick={{ fill: "var(--color-foreground-muted)", fontSize: 12 }}
          tickLine={false}
          tickFormatter={formatChartMonthShort}
        />
        <YAxis
          tick={{ fill: "var(--color-foreground-muted)", fontSize: 12 }}
          tickLine={false}
          tickFormatter={(v) => formatCurrency(v)}
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
            formatCurrency(Number(value)),
            name === "cumulative" ? "Cumulative" : "Monthly",
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "var(--color-foreground-muted)" }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="var(--color-accent)"
          fill="url(#spendingGradient)"
          strokeWidth={2}
          name="Monthly"
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="var(--color-success)"
          fill="url(#cumulativeGradient)"
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Cumulative"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
