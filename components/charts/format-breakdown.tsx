"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BaseTooltipProps } from "./types/shared.types";
import { Library } from "lucide-react";
import { plural } from "@/lib/utils";
import { ChartEmpty } from "./chart-empty";
import { AXIS_TICK, TOOLTIP_BOX } from "./chart-theme";

type FormatBreakdownProps = {
  data: { label: string; count: number }[];
};

function FormatTooltip({ active, payload, label }: BaseTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const { count } = payload[0].payload as { count: number };

  return (
    <div
      style={TOOLTIP_BOX}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 13 }}>
        {plural(count, "book")} owned
      </p>
    </div>
  );
}

export function FormatBreakdown({ data }: FormatBreakdownProps) {
  if (data.every((d) => d.count === 0)) {
    return <ChartEmpty label="owned books" icon={Library} />;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 48)}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" />
        <XAxis
          type="number"
          tick={AXIS_TICK}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={96}
          tick={AXIS_TICK}
          tickLine={false}
        />
        <Tooltip content={<FormatTooltip />} />
        <Bar dataKey="count" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} name="Books" />
      </BarChart>
    </ResponsiveContainer>
  );
}
