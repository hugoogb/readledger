import { cn } from "@/lib/utils";

const FORMATS = ["Novels", "Manga", "Comics", "Non-fiction", "Light novels"];

export function FormatStrip({ className }: { className?: string }) {
  return (
    <ul aria-label="Formats you can track" className={cn("eyebrow flex flex-wrap gap-x-2", className)}>
      {FORMATS.map((format, i) => (
        <li key={format}>
          {format}
          {i < FORMATS.length - 1 && (
            <span aria-hidden="true" className="ml-2">
              ·
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
