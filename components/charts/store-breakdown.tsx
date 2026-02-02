"use client";

import { formatCurrency } from "@/utils/currency";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BaseTooltipProps } from "./types/shared.types";

type StoreBreakdownProps = {
  data: { name: string; count: number; spent: number }[];
};

type StoreTooltipData = {
  count: number;
  spent: number;
};

function StoreTooltip({ active, payload, label }: BaseTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as StoreTooltipData;
  const { count, spent } = data;

  return (
    <div
      style={{
        backgroundColor: "var(--color-background-secondary)",
        border: "1px solid var(--color-border)",
        borderRadius: "0.75rem",
        color: "var(--color-foreground)",
        padding: "0.5rem 0.75rem",
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 13 }}>
        {count} volume{count !== 1 ? "s" : ""}
      </p>
      {spent > 0 && (
        <p style={{ fontSize: 13, color: "var(--color-foreground-muted)" }}>
          {formatCurrency(spent)} spent
        </p>
      )}
    </div>
  );
}

export function StoreBreakdown({ data }: StoreBreakdownProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-foreground-muted text-center py-8">
        No store data yet
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data.slice(0, 10)} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          type="number"
          tick={{ fill: "var(--color-foreground-muted)", fontSize: 12 }}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fill: "var(--color-foreground-muted)", fontSize: 12 }}
          tickLine={false}
        />
        <Tooltip content={<StoreTooltip />} />
        <Bar
          dataKey="count"
          fill="var(--color-success)"
          radius={[0, 4, 4, 0]}
          name="Volumes"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
