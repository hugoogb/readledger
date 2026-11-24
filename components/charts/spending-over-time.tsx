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
import { useFormatCurrency } from "@/components/providers/currency-provider";
import { formatChartMonth, formatChartMonthShort } from "@/utils/date";
import { Wallet } from "lucide-react";
import { ChartEmpty } from "./chart-empty";
import { AXIS_TICK, TOOLTIP_CONTENT } from "./chart-theme";

type SpendingOverTimeProps = {
  data: { month: string; amount: number; cumulative: number }[];
};

export function SpendingOverTime({ data }: SpendingOverTimeProps) {
  const formatCurrency = useFormatCurrency();
  if (data.length === 0) {
    return <ChartEmpty label="spending data" icon={Wallet} />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" />
        <XAxis
          dataKey="month"
          tick={AXIS_TICK}
          tickLine={false}
          tickFormatter={formatChartMonthShort}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          tickFormatter={(v) => formatCurrency(v)}
        />
        <Tooltip
          contentStyle={TOOLTIP_CONTENT}
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
          stroke="var(--color-chart-1)"
          fill="url(#spendingGradient)"
          strokeWidth={2}
          name="Monthly"
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="var(--color-chart-2)"
          fill="url(#cumulativeGradient)"
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Cumulative"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
