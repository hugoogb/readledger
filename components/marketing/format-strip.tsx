import { cn } from "@/lib/utils";

const FORMATS = ["Novels", "Manga", "Comics", "Non-fiction", "Light novels"];

/** The kinds of books ReadLedger tracks, shown as a row of labels. */
export function FormatStrip({ className }: { className?: string }) {
  return (
    <ul aria-label="Formats you can track" className={cn("flex flex-wrap gap-2", className)}>
      {FORMATS.map((format) => (
        <li
          key={format}
          className="rounded-full border border-border bg-background-secondary px-3 py-1 text-sm font-medium text-foreground"
        >
          {format}
        </li>
      ))}
    </ul>
  );
}
