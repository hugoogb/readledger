import { BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ChartEmptyProps = {
  label: string;
  icon?: LucideIcon;
};

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
