import { getReadingGoals, getReadingVolumes } from "@/actions/reading";
import { BacklogTrend } from "@/components/charts/backlog-trend";
import { ReadsPerPeriod } from "@/components/charts/reads-per-period";
import { CoverList } from "@/components/reading/cover-list";
import { GoalCard } from "@/components/reading/goal-card";
import { StatsCard } from "@/components/ui/stats-card";
import {
  availableYears,
  averageBuyToRead,
  backlogTrend,
  bestPeriod,
  comparisonToLastYear,
  currentStreak,
  goalProgress,
  oldestUnread,
  readCount,
  readsByMonth,
  readsByYear,
  topSeries,
  undatedReadCount,
  type Period,
} from "@/lib/reading-stats";
import { formatRelativeDate } from "@/utils/date";
import { BookMarked, CalendarRange, Flame, Hourglass, Target } from "lucide-react";
import { ChartCard } from "./chart-card";
import { ChipNav } from "./chip-nav";
import { UndatedNote } from "./undated-note";

const readingHref = (year: string) => `/dashboard/statistics?tab=reading&year=${year}`;

function resolvePeriod(param: string | undefined, years: number[], currentYear: number): Period {
  if (param === "all") return "all";
  const year = Number(param);
  return years.includes(year) ? year : currentYear;
}

function monthName(label: string) {
  const [y, m] = label.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1)).toLocaleDateString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
}

const plural = (n: number, word: string) => `${n} ${word}${n !== 1 ? "s" : ""}`;

export async function ReadingTab({ yearParam }: { yearParam?: string }) {
  const [volumes, goals] = await Promise.all([getReadingVolumes(), getReadingGoals()]);
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const years = availableYears(volumes, now);
  const period = resolvePeriod(yearParam, years, currentYear);
  const isAll = period === "all";

  const total = readCount(volumes, period);
  const best = bestPeriod(volumes, period);
  const avgLag = averageBuyToRead(volumes, period);
  const streak = currentStreak(volumes, now);
  const comparison = isAll ? null : comparisonToLastYear(volumes, period, now);

  const readsData = isAll
    ? readsByYear(volumes, now).map((y) => ({ label: String(y.year), count: y.count }))
    : readsByMonth(volumes, period).map((m) => ({ label: m.month, count: m.count }));

  const top = topSeries(volumes, period);
  const unread = oldestUnread(volumes);

  let comparisonText: string | undefined;
  if (comparison && (comparison.current > 0 || comparison.previous > 0)) {
    const sign = comparison.delta > 0 ? "+" : "";
    comparisonText =
      period === currentYear
        ? `${sign}${comparison.delta} vs this point in ${period - 1}`
        : `${sign}${comparison.delta} vs ${(period as number) - 1}`;
  }

  return (
    <div className="space-y-6">
      <ChipNav
        label="Reading year"
        active={String(period)}
        items={[
          ...years.map((y) => ({ value: String(y), label: String(y), href: readingHref(String(y)) })),
          { value: "all", label: "All time", href: readingHref("all") },
        ]}
      />

      {isAll ? (
        <GoalHistory goals={goals} volumes={volumes} />
      ) : (
        <GoalCard
          year={period}
          readCount={total}
          progress={goalProgress(goals.find((g) => g.year === period) ?? null, total, period, now)}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatsCard
          compact
          title={isAll ? "Total read" : `Read in ${period}`}
          value={total}
          subtitle={comparisonText}
          icon={BookMarked}
          variant="success"
        />
        <StatsCard
          compact
          title={isAll ? "Best year" : "Best month"}
          value={best ? (isAll ? best.label : monthName(best.label)) : "—"}
          subtitle={best ? plural(best.count, "volume") : undefined}
          icon={CalendarRange}
          variant="accent"
        />
        <StatsCard
          compact
          title="Buy → read"
          value={avgLag === null ? "—" : plural(avgLag, "day")}
          subtitle="average wait"
          icon={Hourglass}
          variant="warning"
        />
        <StatsCard
          compact
          title="Streak"
          value={plural(streak, "week")}
          subtitle="in a row"
          icon={Flame}
          variant="default"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Volumes Read">
          <ReadsPerPeriod data={readsData} granularity={isAll ? "year" : "month"} />
          <UndatedNote count={undatedReadCount(volumes)} kind="read" />
        </ChartCard>
        <ChartCard title="Unread Backlog">
          <BacklogTrend data={backlogTrend(volumes, period, now)} granularity={isAll ? "year" : "month"} />
        </ChartCard>
        <ChartCard title={isAll ? "Most Read Series" : `Most Read in ${period}`}>
          <CoverList
            emptyText="No volumes read in this period yet."
            items={top.map((s) => ({
              key: s.seriesId,
              href: `/dashboard/series/${s.seriesId}`,
              title: s.title,
              subtitle: plural(s.count, "volume") + " read",
              coverImage: s.coverImage,
            }))}
          />
        </ChartCard>
        {unread.length > 0 && (
          <ChartCard title="Oldest Unread">
            <CoverList
              emptyText=""
              items={unread.map((v) => ({
                key: v.id,
                href: `/dashboard/series/${v.seriesId}`,
                title: `${v.series.title} #${v.volumeNumber}`,
                subtitle: `bought ${formatRelativeDate(v.purchaseDate!, now)}`,
                coverImage: v.coverImage ?? v.series.coverImage,
              }))}
            />
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function GoalHistory({
  goals,
  volumes,
}: {
  goals: { year: number; target: number }[];
  volumes: Awaited<ReturnType<typeof getReadingVolumes>>;
}) {
  if (goals.length === 0) return null;

  return (
    <ChartCard title="Goals">
      <ul className="divide-y divide-border">
        {goals.map((g) => {
          const read = readCount(volumes, g.year);
          const reached = read >= g.target;
          return (
            <li key={g.year} className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2 font-medium">
                <Target className={`w-4 h-4 ${reached ? "text-success" : "text-foreground-muted"}`} />
                {g.year}
              </span>
              <span className={`tabular-nums font-semibold ${reached ? "text-success" : ""}`}>
                {read} / {g.target}
                {reached && " ✓"}
              </span>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}
