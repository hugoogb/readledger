"use client";

import { Building2, ShoppingBag, type LucideIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useFormatCurrency } from "@/components/providers/currency-provider";
import { plural } from "@/lib/utils";
import { ChartEmpty } from "./chart-empty";
import { AXIS_TICK, TOOLTIP_BOX } from "./chart-theme";
import type { BaseTooltipProps } from "./types/shared.types";

export type RankedRow = { name: string; count: number; spent: number };

function RankedTooltip({ active, payload, label }: BaseTooltipProps) {
  const formatCurrency = useFormatCurrency();
  if (!active || !payload || payload.length === 0) return null;
  const { count, spent } = payload[0].payload as RankedRow;

  return (
    <div style={TOOLTIP_BOX}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 13 }}>{plural(count, "book")}</p>
      {spent > 0 && (
        <p style={{ fontSize: 13, color: "var(--color-foreground-muted)" }}>
          {formatCurrency(spent)} spent
        </p>
      )}
    </div>
  );
}

function RankedBarChart({
  data,
  emptyLabel,
  emptyIcon,
}: {
  data: RankedRow[];
  emptyLabel: string;
  emptyIcon: LucideIcon;
}) {
  if (data.length === 0) {
    return <ChartEmpty label={emptyLabel} icon={emptyIcon} />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data.slice(0, 10)} layout="vertical">
        <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" />
        <XAxis type="number" tick={AXIS_TICK} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={120} tick={AXIS_TICK} tickLine={false} />
        <Tooltip content={<RankedTooltip />} />
        <Bar dataKey="count" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} name="Books" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StoreBreakdown({ data }: { data: RankedRow[] }) {
  return <RankedBarChart data={data} emptyLabel="store data" emptyIcon={ShoppingBag} />;
}

export function PublisherBreakdown({ data }: { data: RankedRow[] }) {
  return <RankedBarChart data={data} emptyLabel="publisher data" emptyIcon={Building2} />;
}
