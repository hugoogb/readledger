import { cn } from "@/lib/utils";

export function DoubleRule({ className }: { className?: string }) {
  return <div className={cn("double-rule", className)} aria-hidden="true" />;
}
