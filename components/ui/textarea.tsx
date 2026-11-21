import { cn } from "@/lib/utils";
import * as React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  icon?: React.ReactNode;
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, icon, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-4 text-foreground-muted">
            {icon}
          </div>
        )}
        <textarea
          className={cn(
            "flex min-h-30 w-full rounded-md border border-border bg-background-secondary px-3.5 py-2.5 text-base sm:text-sm text-foreground ring-offset-background placeholder:text-foreground-muted/60 focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none",
            icon && "pl-10",
            error && "border-error focus-visible:ring-error",
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
