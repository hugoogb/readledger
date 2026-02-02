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
            "flex min-h-30 w-full rounded-xl border border-border bg-background-tertiary px-4 py-3 text-sm text-foreground ring-offset-background placeholder:text-foreground-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none",
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
