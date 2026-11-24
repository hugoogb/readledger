"use client";

import type { LucideIcon } from "lucide-react";
import { Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import { plural } from "@/lib/utils";
import { ChartEmpty } from "./chart-empty";
import { TOOLTIP_BOX } from "./chart-theme";
import type { BaseTooltipProps } from "./types/shared.types";

export type DonutSlice = { key: string; count: number };

type DonutChartProps = {
  data: DonutSlice[];
  /** Label and colour per slice key. */
  config: Record<string, { label: string; color: string }>;
  /** What a slice counts, e.g. "title" or "book". */
  unit: string;
  /** Colour of the percentage in the tooltip. */
  percentColor: string;
  emptyLabel: string;
  emptyIcon: LucideIcon;
};

const FALLBACK_COLOR = "var(--color-chart-1)";

type SliceTooltipProps = BaseTooltipProps & {
  labelOf: (key: string) => string;
  unit: string;
  total: number;
  percentColor: string;
};

function SliceTooltip({ active, payload, labelOf, unit, total, percentColor }: SliceTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const { key, count } = payload[0].payload as DonutSlice;
  return (
    <div style={TOOLTIP_BOX}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{labelOf(key)}</p>
      <p style={{ fontSize: 13 }}>
        {plural(count, unit)}
        {total > 0 && (
          <span style={{ color: percentColor }}> ({Math.round((count / total) * 100)}%)</span>
        )}
      </p>
    </div>
  );
}

/** Share of a whole as a donut with a legend, e.g. titles per status. */
export function DonutChart({ data, config, unit, percentColor, emptyLabel, emptyIcon }: DonutChartProps) {
  if (data.length === 0) {
    return <ChartEmpty label={emptyLabel} icon={emptyIcon} />;
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const label = (key: string) => config[key]?.label ?? key;
  const color = (key: string) => config[key]?.color ?? FALLBACK_COLOR;

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="count"
            nameKey="key"
            shape={(props) => <Sector {...props} fill={color(props.payload.key as string)} />}
          />
          <Tooltip
            content={<SliceTooltip labelOf={label} unit={unit} total={total} percentColor={percentColor} />}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {data.map((entry) => (
          <div key={entry.key} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color(entry.key) }} />
            <span className="text-foreground-muted">
              {label(entry.key)} ({entry.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
