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
