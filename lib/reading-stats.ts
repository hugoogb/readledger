/**
 * Pure reading statistics over a user's volumes. Everything buckets in UTC
 * (date inputs are stored as UTC midnight) and takes `now` as a parameter so
 * results are deterministic and testable.
 *
 * A volume counts as a "dated read" when it is read *and* has a readDate.
 * Read volumes without a date are excluded from every metric and surfaced
 * separately via `undatedReadCount`.
 */

export type ReadingVolume = {
  id: string;
  seriesId: string;
  volumeNumber: number;
  owned: boolean;
  read: boolean;
  purchaseDate: Date | null;
  readDate: Date | null;
  coverImage: string | null;
  series: { title: string; coverImage: string | null };
};

/** A calendar year, or every year. */
export type Period = number | "all";

type DatedVolume = Pick<ReadingVolume, "owned" | "read" | "purchaseDate" | "readDate">;
type DatedRead<T extends DatedVolume> = T & { read: true; readDate: Date };

const DAY_MS = 86_400_000;

function datedReads<T extends DatedVolume>(volumes: T[]): DatedRead<T>[] {
  return volumes.filter((v): v is DatedRead<T> => v.read && v.readDate !== null);
}

function inPeriod(date: Date, period: Period) {
  return period === "all" || date.getUTCFullYear() === period;
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Monday-start week number since the epoch (1970-01-01 was a Thursday). */
function weekIndex(date: Date) {
  const days = Math.floor(date.getTime() / DAY_MS);
  return Math.floor((days + 3) / 7);
}

function wholeDaysBetween(from: Date, to: Date) {
  return (to.getTime() - from.getTime()) / DAY_MS;
}

function meanBuyToRead(volumes: DatedVolume[]): number | null {
  const lags = datedReads(volumes)
    .filter((v) => v.purchaseDate && v.readDate >= v.purchaseDate)
    .map((v) => wholeDaysBetween(v.purchaseDate!, v.readDate));
  if (lags.length === 0) return null;
  return Math.round(lags.reduce((a, b) => a + b, 0) / lags.length);
}

export function undatedReadCount(volumes: DatedVolume[]) {
  return volumes.filter((v) => v.read && v.readDate === null).length;
}

export function availableYears(volumes: DatedVolume[], now: Date) {
  const years = new Set(datedReads(volumes).map((v) => v.readDate.getUTCFullYear()));
  years.add(now.getUTCFullYear());
  return [...years].sort((a, b) => b - a);
}

export function readsByMonth(volumes: DatedVolume[], year: number) {
  const counts = new Array<number>(12).fill(0);
  for (const v of datedReads(volumes)) {
    if (v.readDate.getUTCFullYear() === year) counts[v.readDate.getUTCMonth()] += 1;
  }
  return counts.map((count, i) => ({
    month: `${year}-${String(i + 1).padStart(2, "0")}`,
    count,
  }));
}

function countByYear(volumes: DatedVolume[]) {
  const counts = new Map<number, number>();
  for (const v of datedReads(volumes)) {
    const y = v.readDate.getUTCFullYear();
    counts.set(y, (counts.get(y) ?? 0) + 1);
  }
  return counts;
}

/** Years with reads, ascending, as chart buckets. */
function yearCounts(volumes: DatedVolume[]) {
  return [...countByYear(volumes)]
    .sort(([a], [b]) => a - b)
    .map(([year, count]) => ({ label: String(year), count }));
}

export function readsByYear(volumes: DatedVolume[], now: Date) {
  const counts = countByYear(volumes);
  if (counts.size === 0) return [];

  const first = Math.min(...counts.keys());
  const last = now.getUTCFullYear();
  const result = [];
  for (let year = first; year <= last; year++) {
    result.push({ year, count: counts.get(year) ?? 0 });
  }
  return result;
}

export function readCount(volumes: DatedVolume[], period: Period) {
  return datedReads(volumes).filter((v) => inPeriod(v.readDate, period)).length;
}

/**
 * Reads in `year` versus the previous year. For the current year the previous
 * year is cut off at the same UTC month/day, so the comparison is like for like.
 */
export function comparisonToLastYear(volumes: DatedVolume[], year: number, now: Date) {
  const current = readCount(volumes, year);
  const isCurrentYear = year === now.getUTCFullYear();
  const cutoff = isCurrentYear
    ? Date.UTC(year - 1, now.getUTCMonth(), now.getUTCDate() + 1)
    : Date.UTC(year, 0, 1);

  const previous = datedReads(volumes).filter(
    (v) => v.readDate.getUTCFullYear() === year - 1 && v.readDate.getTime() < cutoff,
  ).length;

  return { current, previous, delta: current - previous };
}

/** Busiest month of a year (or busiest year overall); earliest wins ties. */
export function bestPeriod(volumes: DatedVolume[], period: Period) {
  const buckets =
    period === "all"
      ? yearCounts(volumes)
      : readsByMonth(volumes, period).map((m) => ({ label: m.month, count: m.count }));

  let best: { label: string; count: number } | null = null;
  for (const b of buckets) {
    if (b.count > 0 && (!best || b.count > best.count)) best = b;
  }
  return best;
}

/** Mean whole days from purchase to read, for reads in the period. */
export function averageBuyToRead(volumes: DatedVolume[], period: Period) {
  return meanBuyToRead(datedReads(volumes).filter((v) => inPeriod(v.readDate, period)));
}

/**
 * Consecutive Monday-start weeks with at least one read, ending this week.
 * An empty current week doesn't break the streak — it may still be filled.
 */
export function currentStreak(volumes: DatedVolume[], now: Date) {
  const weeks = new Set(datedReads(volumes).map((v) => weekIndex(v.readDate)));
  let week = weekIndex(now);
  if (!weeks.has(week)) week -= 1;

  let streak = 0;
  while (weeks.has(week)) {
    streak += 1;
    week -= 1;
  }
  return streak;
}

/**
 * Owned-but-unread volumes at each month end (year view) or year end (all
 * view). The point for the current period is taken at `now`. Volumes whose
 * dates are unknown can't be placed on the timeline and are left out.
 */
export function backlogTrend(volumes: DatedVolume[], period: Period, now: Date) {
  const tracked = volumes.filter(
    (v) => v.owned && v.purchaseDate && !(v.read && v.readDate === null),
  );

  const backlogAt = (at: number) =>
    tracked.filter(
      (v) =>
        v.purchaseDate!.getTime() <= at &&
        !(v.read && v.readDate && v.readDate.getTime() <= at),
    ).length;

  const points: { label: string; count: number }[] = [];
  const nowMs = now.getTime();

  if (period === "all") {
    if (tracked.length === 0) return points;
    const first = Math.min(...tracked.map((v) => v.purchaseDate!.getUTCFullYear()));
    for (let year = first; year <= now.getUTCFullYear(); year++) {
      const end = Math.min(Date.UTC(year + 1, 0, 1) - 1, nowMs);
      points.push({ label: String(year), count: backlogAt(end) });
    }
    return points;
  }

  for (let month = 0; month < 12; month++) {
    const start = Date.UTC(period, month, 1);
    if (start > nowMs) break;
    const end = Math.min(Date.UTC(period, month + 1, 1) - 1, nowMs);
    points.push({ label: monthKey(new Date(start)), count: backlogAt(end) });
  }
  return points;
}

export function topSeries(volumes: ReadingVolume[], period: Period, limit = 5) {
  const bySeries = new Map<
    string,
    { seriesId: string; title: string; coverImage: string | null; count: number }
  >();

  for (const v of datedReads(volumes)) {
    if (!inPeriod(v.readDate, period)) continue;
    const entry = bySeries.get(v.seriesId) ?? {
      seriesId: v.seriesId,
      title: v.series.title,
      coverImage: v.series.coverImage,
      count: 0,
    };
    entry.count += 1;
    bySeries.set(v.seriesId, entry);
  }

  return [...bySeries.values()]
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
    .slice(0, limit);
}

export function oldestUnread(volumes: ReadingVolume[], limit = 5) {
  return volumes
    .filter((v) => v.owned && !v.read && v.purchaseDate)
    .sort((a, b) => a.purchaseDate!.getTime() - b.purchaseDate!.getTime())
    .slice(0, limit);
}

export function recentlyRead(volumes: ReadingVolume[], limit = 5) {
  return datedReads(volumes)
    .sort((a, b) => b.readDate.getTime() - a.readDate.getTime())
    .slice(0, limit);
}

export type GoalProgress = {
  target: number;
  read: number;
  completed: boolean;
  /** Current year only: reads expected by today at an even pace. */
  expected?: number;
  /** Current year only: positive = ahead of pace. */
  paceDelta?: number;
};

export function goalProgress(
  goal: { year: number; target: number } | null,
  read: number,
  year: number,
  now: Date,
): GoalProgress | null {
  if (!goal) return null;

  const base = { target: goal.target, read, completed: read >= goal.target };
  if (year !== now.getUTCFullYear()) return base;

  const yearStart = Date.UTC(year, 0, 1);
  const daysInYear = (Date.UTC(year + 1, 0, 1) - yearStart) / DAY_MS;
  const elapsedDays = Math.floor((now.getTime() - yearStart) / DAY_MS) + 1;
  const expected = Math.floor((goal.target * elapsedDays) / daysInYear);

  return { ...base, expected, paceDelta: read - expected };
}

export function seriesTimeline(volumes: DatedVolume[]) {
  const purchases = volumes
    .filter((v) => v.owned && v.purchaseDate)
    .map((v) => v.purchaseDate!.getTime());
  const reads = datedReads(volumes).map((v) => v.readDate.getTime());

  const firstRead = reads.length ? Math.min(...reads) : null;
  const lastRead = reads.length ? Math.max(...reads) : null;

  let pacePerWeek: number | null = null;
  if (firstRead !== null && lastRead !== null && reads.length >= 2) {
    const spanDays = (lastRead - firstRead) / DAY_MS;
    if (spanDays >= 7) pacePerWeek = Math.round((reads.length / (spanDays / 7)) * 10) / 10;
  }

  return {
    startedCollecting: purchases.length ? new Date(Math.min(...purchases)) : null,
    firstRead: firstRead !== null ? new Date(firstRead) : null,
    lastRead: lastRead !== null ? new Date(lastRead) : null,
    pacePerWeek,
    averageBuyToRead: meanBuyToRead(volumes),
  };
}
