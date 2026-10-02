import { LucideIcon } from "lucide-react";

type StatsCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "accent" | "success" | "warning";
  className?: string;
  /** Tighter layout for 2-up grids on phones: smaller value, icon from sm up. */
  compact?: boolean;
};

const variants = {
  default: {
    icon: "bg-foreground-muted/10 border-foreground-muted/20 text-foreground-muted",
  },
  accent: {
    icon: "bg-accent/10 border-accent/20 text-accent",
  },
  success: {
    icon: "bg-success/10 border-success/20 text-success",
  },
  warning: {
    icon: "bg-warning/10 border-warning/20 text-warning",
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  className = "",
  compact = false,
}: StatsCardProps) {
  const styles = variants[variant];

  return (
    <div className={`glass rounded-2xl ${compact ? "p-4" : "p-6"} ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-foreground-muted font-medium">{title}</p>
          <p className={`${compact ? "text-2xl" : "text-3xl"} font-bold mt-2`}>{value}</p>
          {subtitle && (
            <p className="text-sm text-foreground-muted mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`${compact ? "hidden sm:flex w-10 h-10" : "flex w-12 h-12"} shrink-0 rounded-xl border items-center justify-center ${styles.icon}`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
