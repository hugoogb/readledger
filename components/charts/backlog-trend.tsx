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
import { plural } from "@/lib/utils";
import { ChartEmpty } from "./chart-empty";
import { AXIS_TICK, TOOLTIP_CONTENT } from "./chart-theme";

type BacklogTrendProps = {
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
          tick={AXIS_TICK}
          tickLine={false}
          tickFormatter={(v: string) => (isMonth ? formatChartMonthShort(v) : v)}
        />
        <YAxis
          allowDecimals={false}
          tick={AXIS_TICK}
          tickLine={false}
        />
        <Tooltip
          contentStyle={TOOLTIP_CONTENT}
          labelFormatter={(label) => (isMonth ? formatChartMonth(String(label)) : String(label))}
          formatter={(value) => [
            plural(Number(value), "book"),
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
