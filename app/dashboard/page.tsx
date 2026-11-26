import { getReadingGoals, getReadingVolumes } from "@/actions/reading";
import { getRecentSeries, getSeriesStats } from "@/actions/series";
import { CoverShelf } from "@/components/books/cover-shelf";
import { Greeting } from "@/components/dashboard/greeting";
import { AddBookButton } from "@/components/series/add-book-provider";
import { Ledger, LedgerRow, LedgerTotal } from "@/components/ui/ledger";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import { LedgerSkeleton, Skeleton } from "@/components/ui/skeletons";
import { ShelvesSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { getCurrentUser } from "@/lib/auth";
import { getFormatCurrency } from "@/lib/currency";
import { isStandalone } from "@/lib/format";
import { goalProgress, readCount, recentlyRead, type GoalProgress } from "@/lib/reading-stats";
import { formatRelativeDate } from "@/utils/date";
import Link from "next/link";
import { Suspense } from "react";

async function DashboardLedger() {
  const [stats, readingVolumes, goals, formatCurrency] = await Promise.all([
    getSeriesStats(),
    getReadingVolumes(),
    getReadingGoals(),
    getFormatCurrency(),
  ]);
  const now = new Date();
  const year = now.getUTCFullYear();
  const readThisYear = readCount(readingVolumes, year);
  const goal = goalProgress(goals.find((g) => g.year === year) ?? null, readThisYear, year, now);
  const missing = Math.max(0, stats.totalExpectedVolumes - stats.totalVolumesOwned);
  const unread = Math.max(0, stats.totalVolumesOwned - stats.totalVolumesRead);

  return (
    <>
      <Ledger>
        <LedgerRow label="Titles" value={stats.totalSeries} />
        <LedgerRow
          label="Books owned"
          note={missing > 0 ? `${missing} missing` : undefined}
          value={stats.totalVolumesOwned}
        />
        <LedgerRow
          label="Read"
          note={unread > 0 ? `${unread} unread` : undefined}
          value={stats.totalVolumesRead}
        />
        {stats.totalSavings > 0 && (
          <LedgerRow label="Saved buying used" value={formatCurrency(stats.totalSavings)} />
        )}
        <LedgerTotal
          label={`Spent · ${formatCurrency(stats.averagePrice)} avg`}
          value={formatCurrency(stats.totalSpent)}
        />
      </Ledger>
      <GoalPanel year={year} read={readThisYear} goal={goal} />
    </>
  );
}

function paceNote(goal: GoalProgress) {
  if (goal.completed) return "Goal reached";
  if (goal.paceDelta === undefined) return `${goal.target - goal.read} to go`;
  if (goal.paceDelta > 0) return `${goal.paceDelta} ahead of pace`;
  if (goal.paceDelta < 0) return `${-goal.paceDelta} behind pace`;
  return "Right on pace";
}

function GoalPanel({ year, read, goal }: { year: number; read: number; goal: GoalProgress | null }) {
  return (
    <Link
      href="/dashboard/statistics?tab=reading"
      className="mt-5 block rounded-lg border border-border bg-background-secondary p-4 transition-colors hover:border-border-hover"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">Reading in {year}</span>
        <span>
          <span className="figure text-xl">{read}</span>
          {goal && <span className="text-sm text-foreground-muted"> / {goal.target}</span>}
        </span>
      </div>
      {goal ? (
        <>
          <ProgressBar value={goal.read} max={goal.target} size="md" className="mt-2" ariaLabel="Reading goal" />
          <p className="mt-1.5 text-xs text-foreground-muted">{paceNote(goal)}</p>
        </>
      ) : (
        <p className="mt-1 text-xs text-foreground-muted">No reading goal yet. Set one in Statistics.</p>
      )}
    </Link>
  );
}

async function StatusLine() {
  const { byStatus } = await getSeriesStats();
  const parts = [
    [byStatus.reading, "reading"],
    [byStatus.completed, "completed"],
    [byStatus.onHold, "on hold"],
    [byStatus.dropped, "dropped"],
    [byStatus.planToRead, "planned"],
  ] as const;

  return (
    <section>
      <SectionHeading title="By status" />
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-muted">
        {parts.map(([count, label]) => (
          <span key={label}>
            <span className="figure mr-1 text-base text-foreground">{count}</span>
            {label}
          </span>
        ))}
      </p>
    </section>
  );
}

async function Shelves() {
  const [recent, volumes, stats] = await Promise.all([
    getRecentSeries(),
    getReadingVolumes(),
    getSeriesStats(),
  ]);
  const now = new Date();

  if (stats.totalSeries === 0) {
    return (
      <section className="border-t-2 border-foreground pt-5">
        <p className="font-serif text-2xl font-medium">Your shelves are empty.</p>
        <p className="mt-1 text-foreground-muted">
          Search by title or ISBN, or scan a barcode, and your first book is in.
        </p>
        <AddBookButton className="mt-5" label="Add your first book" />
      </section>
    );
  }

  return (
    <>
      <section>
        <SectionHeading title="Recently updated" action={{ href: "/dashboard/library", label: "View all" }} />
        <CoverShelf
          emptyText="Nothing here yet."
          items={recent.map((series) => {
            const owned = series.volumes.filter((v) => v.owned).length;
            const standalone = isStandalone(series.totalVolumes, series.volumes.length);
            const total = series.totalVolumes || series.volumes.length;
            return {
              key: series.id,
              href: `/dashboard/library/${series.id}`,
              title: series.title,
              caption: standalone ? (owned > 0 ? "Owned" : "Not owned") : `${owned} / ${total}`,
              coverImage: series.coverImage,
            };
          })}
        />
      </section>

      <section>
        <SectionHeading
          title="Recently read"
          action={{ href: "/dashboard/statistics?tab=reading", label: "Reading stats" }}
        />
        <CoverShelf
          emptyText="Books you mark as read will show up here."
          items={recentlyRead(volumes, 6).map((v) => ({
            key: v.id,
            href: `/dashboard/library/${v.seriesId}`,
            title: v.series.title,
            caption: v.series.standalone
              ? formatRelativeDate(v.readDate, now)
              : `Vol. ${v.volumeNumber}`,
            coverImage: v.coverImage ?? v.series.coverImage,
          }))}
        />
      </section>

      <section className="space-y-5">
        <ProgressLine
          title="Collection progress"
          note={`${stats.totalVolumesOwned} of ${stats.totalExpectedVolumes} volumes`}
          value={stats.collectionProgress}
        />
        <ProgressLine
          title="Reading progress"
          note={`${stats.totalVolumesRead} of ${stats.totalVolumesOwned} owned`}
          value={stats.readingProgress}
          variant="gilt"
        />
      </section>
    </>
  );
}

function ProgressLine({
  title,
  note,
  value,
  variant = "accent",
}: {
  title: string;
  note: string;
  value: number;
  variant?: "accent" | "gilt";
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-[1.2rem] font-medium leading-tight lg:text-xl">{title}</h2>
        <span className="text-xs text-foreground-muted">{note}</span>
      </div>
      <ProgressBar value={value} size="lg" variant={variant} ariaLabel={title} />
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="p-4 lg:p-8">
      <div className="mx-auto max-w-[1200px]">
        <Greeting name={user?.name ?? null} />

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,380px)_1fr] lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-10">
          <div className="lg:col-start-1 lg:row-start-1">
            <Suspense fallback={<LedgerSkeleton rows={5} />}>
              <DashboardLedger />
            </Suspense>
          </div>
          <div className="space-y-10 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <Suspense fallback={<ShelvesSkeleton />}>
              <Shelves />
            </Suspense>
          </div>
          <div className="lg:col-start-1 lg:row-start-2">
            <Suspense fallback={<Skeleton className="h-16 w-full" />}>
              <StatusLine />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
