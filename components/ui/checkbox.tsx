"use client";

import { Check } from "lucide-react";

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  variant?: "default" | "success" | "accent";
};

const variantStyles = {
  default: {
    checked: "bg-accent border-accent",
    unchecked: "border-border-hover hover:border-accent/50",
  },
  success: {
    checked: "bg-success border-success",
    unchecked: "border-border-hover hover:border-success/50",
  },
  accent: {
    checked: "bg-accent border-accent",
    unchecked: "border-border-hover hover:border-accent/50",
  },
};

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  variant = "default",
}: CheckboxProps) {
  const styles = variantStyles[variant];

  return (
    <label
      className={`group flex items-start gap-3 cursor-pointer select-none ${disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
    >
      <div className="relative shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${checked
            ? styles.checked
            : `bg-background-tertiary ${styles.unchecked}`
            } ${!disabled && !checked ? "group-hover:bg-background-secondary" : ""}`}
        >
          <Check
            className={`w-3.5 h-3.5 text-white transition-all duration-200 ${checked ? "opacity-100 scale-100" : "opacity-0 scale-75"
              }`}
            strokeWidth={3}
          />
        </div>
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          {description && (
            <span className="text-xs text-foreground-muted mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}
