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
import { Building2 } from "lucide-react";
import { ChartEmpty } from "./chart-empty";

type PublisherBreakdownProps = {
  data: { name: string; volumes: number; spent: number }[];
};

type PublisherTooltipData = {
  volumes: number;
  spent: number;
};

function PublisherTooltip({ active, payload, label }: BaseTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as PublisherTooltipData;
  const { volumes, spent } = data;

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
        {volumes} volume{volumes !== 1 ? "s" : ""}
      </p>
      {spent > 0 && (
        <p style={{ fontSize: 13, color: "var(--color-foreground-muted)" }}>
          {formatCurrency(spent)} spent
        </p>
      )}
    </div>
  );
}

export function PublisherBreakdown({ data }: PublisherBreakdownProps) {
  if (data.length === 0) {
    return <ChartEmpty label="publisher data" icon={Building2} />;
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
        <Tooltip content={<PublisherTooltip />} />
        <Bar
          dataKey="volumes"
          fill="var(--color-accent)"
          radius={[0, 4, 4, 0]}
          name="Volumes"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
