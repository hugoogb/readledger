"use client";

import { Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import { BaseTooltipProps } from "./types/shared.types";

type ConditionDistributionProps = {
  data: { condition: keyof typeof CONDITION_CONFIG; count: number }[];
};

const CONDITION_CONFIG = {
  NEW: {
    label: "New",
    color: "var(--color-accent)",
  },
  LIKE_NEW: {
    label: "Like New",
    color: "var(--color-success)",
  },
  VERY_GOOD: {
    label: "Very Good",
    color: "var(--color-accent-hover)",
  },
  GOOD: {
    label: "Good",
    color: "var(--color-warning)",
  },
  ACCEPTABLE: {
    label: "Acceptable",
    color: "var(--color-error)",
  },
  POOR: {
    label: "Poor",
    color: "var(--color-foreground-muted)",
  },
} as const;

type ConditionKey = keyof typeof CONDITION_CONFIG;

type ConditionTooltipData = {
  condition: ConditionKey;
  count: number;
  _total?: number;
};

function ConditionTooltip({ active, payload }: BaseTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as ConditionTooltipData;
  const { condition, count, _total } = data;
  const config = CONDITION_CONFIG[condition];

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
      <p style={{ fontWeight: 600, marginBottom: 4 }}>
        {config?.label ?? condition}
      </p>
      <p style={{ fontSize: 13 }}>
        {count} volumes
        {_total && _total > 0 && (
          <span style={{ color: "var(--color-foreground-muted)" }}>
            {" "}
            ({Math.round((count / _total) * 100)}%)
          </span>
        )}
      </p>
    </div>
  );
}

export function ConditionDistribution({ data }: ConditionDistributionProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-foreground-muted text-center py-8">
        No condition data yet
      </p>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const enrichedData = data.map((d) => ({ ...d, _total: total }));

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={enrichedData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="count"
            nameKey="condition"
            shape={(props) => {
              const condition = props.payload.condition as ConditionKey;

              return (
                <Sector
                  {...props}
                  fill={CONDITION_CONFIG[condition]?.color ?? "var(--color-accent)"}
                />
              );
            }}
          />

          <Tooltip content={<ConditionTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {data.map((entry) => {
          const config = CONDITION_CONFIG[entry.condition];
          return (
            <div key={entry.condition} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: config?.color ?? "var(--color-accent)",
                }}
              />
              <span className="text-foreground-muted">
                {config?.label ?? entry.condition} ({entry.count})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
