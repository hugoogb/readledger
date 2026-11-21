import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-foreground hover:bg-accent-hover",
        destructive: "bg-error text-accent-foreground hover:bg-error/90",
        outline:
          "border border-border-hover bg-transparent hover:bg-background-tertiary text-foreground",
        secondary:
          "bg-background-secondary text-foreground hover:bg-background-tertiary border border-border",
        ghost:
          "hover:bg-background-tertiary hover:text-foreground text-foreground-muted",
        link: "text-foreground underline underline-offset-4 decoration-border-hover hover:decoration-foreground",
        success: "bg-success text-accent-foreground hover:bg-success/90",
        warning: "bg-warning text-accent-foreground hover:bg-warning/90",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * When true, shows a spinner in place of any leading icon and disables the
   * button. Keeps the label visible so the button width stays stable.
   */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => {
    const isIconOnly = size === "icon" || size === "icon-sm";
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
        {/* For icon-only buttons the spinner replaces the icon entirely. */}
        {isIconOnly && loading ? null : children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
