import { cn } from "@/lib/utils";

/** The bookkeeper's double rule: drawn under totals, never as a plain divider. */
export function DoubleRule({ className }: { className?: string }) {
  return <div className={cn("double-rule", className)} aria-hidden="true" />;
}
