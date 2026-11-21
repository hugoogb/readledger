import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
  error?: boolean;
  /** Classes for the wrapper; put width constraints here so the chevron stays inside the field. */
  containerClassName?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, containerClassName, children, icon, error, ...props }, ref) => {
    return (
      <div className={cn("relative group/select", containerClassName)}>
        <select
          className={cn(
            "flex h-11 w-full rounded-md border border-border bg-background-secondary px-3.5 py-2.5 text-base sm:text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 transition-colors appearance-none cursor-pointer pr-10 hover:border-border-hover",
            error && "border-error focus-visible:ring-error",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground-muted group-hover/select:text-foreground transition-colors">
          {icon || <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
