import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, icon, ...props }, ref) => {
    return (
      <div className="relative group/select">
        <select
          className={cn(
            "flex h-12 w-full rounded-xl border border-border bg-background-tertiary px-4 py-3 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors appearance-none cursor-pointer pr-10 hover:border-border-hover",
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
