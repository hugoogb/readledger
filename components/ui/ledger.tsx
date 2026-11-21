import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DoubleRule } from "./double-rule";

/** A column of ledger rows separated by hairlines. */
export function Ledger({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("border-t border-border", className)}>{children}</div>;
}

type LedgerRowProps = {
  label: ReactNode;
  /** Muted aside after the label, e.g. "· 23 missing". */
  note?: ReactNode;
  value: ReactNode;
  href?: string;
};

/** Label · dotted leader · figure. The label truncates; the figure never shrinks. */
export function LedgerRow({ label, note, value, href }: LedgerRowProps) {
  const content = (
    <>
      <span className="min-w-0">
        <span className="block truncate sm:inline">{label}</span>
        {/* Under the label on phones, inline from sm; never truncated. */}
        {note && (
          <span className="block text-xs text-foreground-muted sm:ml-1.5 sm:inline">
            <span aria-hidden="true" className="hidden sm:inline">
              ·{" "}
            </span>
            {note}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className="min-w-4 flex-1 translate-y-[-4px] border-b border-dotted border-foreground-muted/50"
      />
      <span className="figure shrink-0 text-lg">{value}</span>
    </>
  );
  const row = "flex min-h-11 items-baseline gap-2 border-b border-border py-2.5 text-sm";

  return href ? (
    <Link href={href} className={cn(row, "hover:bg-background-tertiary/60 -mx-2 px-2")}>
      {content}
    </Link>
  ) : (
    <div className={row}>{content}</div>
  );
}

/** The closing total: small caps label, larger figure, then the double rule. */
export function LedgerTotal({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 pt-3 pb-1.5">
        <span className="eyebrow min-w-0 truncate">{label}</span>
        <span className="figure shrink-0 text-2xl">{value}</span>
      </div>
      <DoubleRule />
    </div>
  );
}
