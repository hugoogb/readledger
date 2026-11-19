type UndatedNoteProps = {
  count: number;
  /** Which date is missing: purchase for collection charts, read for reading ones. */
  kind: "purchase" | "read";
};

/** Footnote for books a date-based chart can't place. */
export function UndatedNote({ count, kind }: UndatedNoteProps) {
  if (count === 0) return null;
  const plural = count !== 1;
  const subject = kind === "purchase" ? "owned" : "read";

  return (
    <p className="text-xs text-foreground-muted mt-3">
      {count} {subject} book{plural ? "s have" : " has"} no {kind} date and{" "}
      {plural ? "aren't" : "isn't"} {kind === "purchase" ? "shown" : "counted"} here.
    </p>
  );
}
