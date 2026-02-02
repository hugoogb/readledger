"use client";

import { Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import { BaseTooltipProps } from "./types/shared.types";

type StatusDistributionProps = {
  data: { status: keyof typeof STATUS_CONFIG; count: number }[];
};

const STATUS_CONFIG = {
  READING: {
    label: "Reading",
    color: "var(--color-accent)",
  },
  COMPLETED: {
    label: "Completed",
    color: "var(--color-success)",
  },
  ON_HOLD: {
    label: "On Hold",
    color: "var(--color-warning)",
  },
  DROPPED: {
    label: "Dropped",
    color: "var(--color-error)",
  },
  PLAN_TO_READ: {
    label: "Plan to Read",
    color: "var(--color-foreground-muted)",
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

type StatusTooltipData = {
  status: StatusKey;
  count: number;
  _total?: number;
};

function StatusTooltip({ active, payload }: BaseTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as StatusTooltipData;
  const { status, count, _total } = data;
  const config = STATUS_CONFIG[status];

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
        {config?.label ?? status}
      </p>
      <p style={{ fontSize: 13 }}>
        {count} series
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

export function StatusDistribution({ data }: StatusDistributionProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-foreground-muted text-center py-8">
        No series data yet
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
            nameKey="status"
            shape={(props) => {
              const status = props.payload.status as keyof typeof STATUS_CONFIG;

              return (
                <Sector
                  {...props}
                  fill={STATUS_CONFIG[status]?.color ?? "var(--color-accent)"}
                />
              );
            }}
          />

          <Tooltip content={<StatusTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {data.map((entry) => {
          const config = STATUS_CONFIG[entry.status];
          return (
            <div key={entry.status} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: config?.color ?? "var(--color-accent)",
                }}
              />
              <span className="text-foreground-muted">
                {config?.label ?? entry.status} ({entry.count})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
