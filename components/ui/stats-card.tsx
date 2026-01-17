import { LucideIcon } from "lucide-react";

type StatsCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "accent" | "success" | "warning";
  className?: string;
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
}: StatsCardProps) {
  const styles = variants[variant];

  return (
    <div className={`glass rounded-2xl p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-foreground-muted font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-foreground-muted mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl border flex items-center justify-center ${styles.icon}`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
