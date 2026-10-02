export const formatDateForInput = (date: Date | string | null | undefined) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

/**
 * Format a "YYYY-MM" string to a full month label, e.g. "January 2024"
 */
export function formatChartMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Format a "YYYY-MM" string to a short label for axis ticks, e.g. "Jan '24"
 */
export function formatChartMonthShort(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

/** Short calendar date in UTC, e.g. "Jan 8, 2026". */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Coarse relative time from `now`, e.g. "today", "3 days ago",
 * "2 weeks ago", "14 months ago", "2 years ago".
 */
export function formatRelativeDate(date: Date, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

  if (days < 1) return "today";
  if (days < 14) return rtf.format(-days, "day");
  if (days < 60) return rtf.format(-Math.floor(days / 7), "week");
  if (days < 730) return rtf.format(-Math.floor(days / 30), "month");
  return rtf.format(-Math.floor(days / 365), "year");
}
