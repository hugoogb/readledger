import { BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ChartEmptyProps = {
  /** Short description of what data is missing, e.g. "spending". */
  label: string;
  icon?: LucideIcon;
};

/**
 * Shared empty state for charts with no data yet. Sized to roughly match the
 * 300px chart height so cards don't collapse when empty.
 */
export function ChartEmpty({ label, icon: Icon = BarChart3 }: ChartEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center h-[300px] gap-3">
      <Icon className="size-6 text-foreground-muted" aria-hidden="true" />
      <div>
        <p className="font-serif text-lg font-medium text-foreground">No {label} yet</p>
        <p className="text-sm text-foreground-muted mt-0.5">
          Add books to your collection to see this chart come to life.
        </p>
      </div>
    </div>
  );
}
