import { getReadingGoals, getReadingVolumes } from "@/actions/reading";
import { BacklogTrend } from "@/components/charts/backlog-trend";
import { ReadsPerPeriod } from "@/components/charts/reads-per-period";
import { CoverList } from "@/components/reading/cover-list";
import { GoalCard } from "@/components/reading/goal-card";
import { Ledger, LedgerRow } from "@/components/ui/ledger";
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
import { volumeLabel } from "@/lib/format";
import { formatRelativeDate } from "@/utils/date";
import { Check, Target } from "lucide-react";
import { ChartCard } from "./chart-card";
import { ChipNav } from "./chip-nav";
import { UndatedNote } from "./undated-note";
import { plural } from "@/lib/utils";

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

      <Ledger className="max-w-[40rem]">
        <LedgerRow
          label={isAll ? "Total read" : `Read in ${period}`}
          note={comparisonText}
          value={total}
        />
        <LedgerRow
          label={isAll ? "Best year" : "Best month"}
          note={best ? plural(best.count, "book") : undefined}
          value={best ? (isAll ? best.label : monthName(best.label)) : "—"}
        />
        <LedgerRow label="Buy to read" note="average wait" value={avgLag === null ? "—" : plural(avgLag, "day")} />
        <LedgerRow label="Weekly streak" value={plural(streak, "week")} />
      </Ledger>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Books Read">
          <ReadsPerPeriod data={readsData} granularity={isAll ? "year" : "month"} />
          <UndatedNote count={undatedReadCount(volumes)} kind="read" />
        </ChartCard>
        <ChartCard title="Unread Backlog">
          <BacklogTrend data={backlogTrend(volumes, period, now)} granularity={isAll ? "year" : "month"} />
        </ChartCard>
        <ChartCard title={isAll ? "Most Read" : `Most Read in ${period}`}>
          <CoverList
            emptyText="No books read in this period yet."
            items={top.map((s) => ({
              key: s.seriesId,
              href: `/dashboard/library/${s.seriesId}`,
              title: s.title,
              subtitle: plural(s.count, "book") + " read",
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
                href: `/dashboard/library/${v.seriesId}`,
                title: volumeLabel(v.series.title, v.volumeNumber, v.series.standalone),
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
              <span className={`figure ${reached ? "text-success" : ""}`}>
                {read} / {g.target}
                {reached && <Check className="ml-1 inline size-4 align-[-2px]" role="img" aria-label="Goal reached" />}
              </span>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}
