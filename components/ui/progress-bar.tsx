type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: "accent" | "gilt" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const variants = {
  accent: "bg-accent",
  gilt: "bg-gilt",
  success: "bg-success",
  warning: "bg-warning",
};

const sizes = {
  sm: "h-1",
  md: "h-1.5",
  lg: "h-2",
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  variant = "accent",
  size = "md",
  className = "",
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-foreground-muted">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="figure text-sm">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-border rounded-full overflow-hidden ${sizes[size]}`}
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Progress"}
      >
        <div
          className={`progress-bar ${sizes[size]} rounded-full ${variants[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
