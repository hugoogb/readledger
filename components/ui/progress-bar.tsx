type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: "accent" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const variants = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
};

const sizes = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
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
            <span className="text-sm font-medium">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-background-tertiary rounded-full overflow-hidden ${sizes[size]}`}
      >
        <div
          className={`progress-bar ${sizes[size]} rounded-full ${variants[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
