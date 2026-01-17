import { getSeriesStats, getAllSeries } from "@/actions/series";
import { StatsCard } from "@/components/ui/stats-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  Library,
  BookOpen,
  BookMarked,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  PauseCircle,
  PiggyBank,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/utils/currency";

export default async function DashboardPage() {
  const [stats, recentSeries] = await Promise.all([
    getSeriesStats(),
    getAllSeries(),
  ]);

  const topSeries = recentSeries.slice(0, 5);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-foreground-muted mt-1">
          Overview of your manga collection
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="animate-fade-in stagger-1">
          <StatsCard
            title="Total Series"
            value={stats.totalSeries}
            subtitle={`${stats.byStatus.reading} currently reading`}
            icon={Library}
            variant="accent"
          />
        </div>
        <div className="animate-fade-in stagger-2">
          <StatsCard
            title="Volumes Owned"
            value={stats.totalVolumesOwned}
            subtitle={`${stats.totalExpectedVolumes - stats.totalVolumesOwned} missing`}
            icon={BookOpen}
            variant="success"
          />
        </div>
        <div className="animate-fade-in stagger-3">
          <StatsCard
            title="Volumes Read"
            value={stats.totalVolumesRead}
            subtitle={`${stats.totalVolumesOwned - stats.totalVolumesRead} unread`}
            icon={BookMarked}
            variant="default"
          />
        </div>
        <div className="animate-fade-in stagger-4">
          <StatsCard
            title="Total Spent"
            value={formatCurrency(stats.totalSpent)}
            subtitle={`${formatCurrency(stats.averagePrice)} avg per volume`}
            icon={Wallet}
            variant="warning"
          />
        </div>
        <div className="animate-fade-in stagger-5">
          <StatsCard
            title="Total Savings"
            value={formatCurrency(stats.totalSavings)}
            subtitle={
              stats.savingsPercentage > 0
                ? `${stats.savingsPercentage.toFixed(0)}% saved`
                : undefined
            }
            icon={PiggyBank}
            variant="success"
          />
        </div>
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass rounded-2xl p-6 animate-fade-in stagger-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Collection Progress</h2>
              <p className="text-sm text-foreground-muted">
                How complete is your collection
              </p>
            </div>
          </div>
          <ProgressBar
            value={stats.collectionProgress}
            variant="accent"
            size="lg"
            showPercentage
            className="mb-4"
          />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-foreground-muted">Owned</p>
              <p className="text-xl font-semibold">{stats.totalVolumesOwned}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Total Expected</p>
              <p className="text-xl font-semibold">
                {stats.totalExpectedVolumes}
              </p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 animate-fade-in stagger-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center">
              <BookMarked className="w-5 h-5 text-success" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Reading Progress</h2>
              <p className="text-sm text-foreground-muted">
                Volumes read vs owned
              </p>
            </div>
          </div>
          <ProgressBar
            value={stats.readingProgress}
            variant="success"
            size="lg"
            showPercentage
            className="mb-4"
          />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-foreground-muted">Read</p>
              <p className="text-xl font-semibold">{stats.totalVolumesRead}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Owned</p>
              <p className="text-xl font-semibold">{stats.totalVolumesOwned}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown and Recent Series */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        <div className="glass rounded-2xl p-6 animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">By Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-sm">Reading</span>
              </div>
              <span className="font-semibold">{stats.byStatus.reading}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm">Completed</span>
              </div>
              <span className="font-semibold">{stats.byStatus.completed}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <PauseCircle className="w-4 h-4 text-warning" />
                <span className="text-sm">On Hold</span>
              </div>
              <span className="font-semibold">{stats.byStatus.onHold}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-foreground-muted" />
                <span className="text-sm">Plan to Read</span>
              </div>
              <span className="font-semibold">{stats.byStatus.planToRead}</span>
            </div>
          </div>
        </div>

        {/* Recent Series */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Series</h2>
            <Link
              href="/dashboard/series"
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              View all
            </Link>
          </div>
          {topSeries.length === 0 ? (
            <div className="text-center py-8">
              <Library className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
              <p className="text-foreground-muted mb-4">No series added yet</p>
              <Link
                href="/dashboard/series"
                className="inline-flex items-center gap-2 text-accent hover:text-accent-hover transition-colors"
              >
                Add your first series
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {topSeries.map((series) => {
                const owned = series.volumes.filter((v) => v.owned).length;
                const total = series.totalVolumes || series.volumes.length;
                const progress = total > 0 ? (owned / total) * 100 : 0;

                return (
                  <Link
                    key={series.id}
                    href={`/dashboard/series/${series.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-background-tertiary transition-colors"
                  >
                    {series.coverImage ? (
                      <Image
                        width={48}
                        height={64}
                        src={series.coverImage}
                        alt={series.title}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-16 rounded-lg bg-background-tertiary flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-foreground-muted" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{series.title}</h3>
                      <p className="text-sm text-foreground-muted">
                        {owned} / {total} volumes
                      </p>
                      <ProgressBar
                        value={progress}
                        variant="accent"
                        size="sm"
                        className="mt-2"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
