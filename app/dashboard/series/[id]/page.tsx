import { getSeries } from "@/actions/series";
import { getVolumeStats } from "@/actions/volumes";
import type { Metadata } from "next";
import { VolumeGrid } from "@/components/volumes/volume-grid";
import { BulkMarkOwnedModal } from "@/components/volumes/bulk-mark-owned-modal";
import { BulkSetReadModal } from "@/components/volumes/bulk-set-read-modal";
import { EditSeriesModal } from "@/components/series/edit-series-modal";
import { StatsCard } from "@/components/ui/stats-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BookOpen,
  Package,
  BookMarked,
  Wallet,
  User,
  PiggyBank,
  Building2,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

const editorialLabels: Record<string, string> = {
  PLANETA_COMIC: "Planeta Cómic",
  PLANETA_DEAGOSTINI: "Planeta DeAgostini",
};

const statusConfig: Record<
  string,
  {
    label: string;
    variant:
      | "default"
      | "secondary"
      | "outline"
      | "destructive"
      | "success"
      | "warning";
  }
> = {
  READING: { label: "Reading", variant: "default" },
  COMPLETED: { label: "Completed", variant: "success" },
  ON_HOLD: { label: "On Hold", variant: "warning" },
  DROPPED: { label: "Dropped", variant: "destructive" },
  PLAN_TO_READ: { label: "Plan to Read", variant: "secondary" },
};

type Props = {
  params: Promise<{ id: string }>;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const series = await getSeries(id);

  if (!series) {
    return {
      title: "Series Not Found",
    };
  }

  return {
    title: series.title,
    description:
      series.description || `Track your collection of ${series.title}`,
    openGraph: {
      title: `${series.title} | ReadLedger`,
      description:
        series.description || `Track your collection of ${series.title}`,
      images: series.coverImage ? [series.coverImage] : [],
    },
  };
}

export default async function SeriesDetailPage({ params }: Props) {
  const { id } = await params;
  const series = await getSeries(id);

  if (!series) {
    notFound();
  }

  const stats = await getVolumeStats(id);
  const statusInfo = statusConfig[series.status] || statusConfig.READING;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <Link
          href="/dashboard/series"
          className="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Series
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cover */}
          <div className="w-48 shrink-0">
            {series.coverImage ? (
              <Image
                width={192}
                height={256}
                src={series.coverImage}
                alt={series.title}
                className="aspect-3/4 rounded-2xl object-cover shadow-xl"
              />
            ) : (
              <div className="w-full aspect-3/4 rounded-2xl bg-background-tertiary flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-foreground-muted/30" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{series.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-foreground-muted">
                  {series.author && (
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {series.author}
                    </span>
                  )}
                  {series.editorial && (
                    <span className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {editorialLabels[series.editorial] || series.editorial}
                    </span>
                  )}
                  {series.retailPrice && (
                    <span className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      {formatCurrency(series.retailPrice)}/vol (retail)
                    </span>
                  )}
                  {series.retailPrice && series.totalVolumes && (
                    <span className="flex items-center gap-2">
                      <WalletCards className="w-4 h-4" />
                      Total retail:{" "}
                      {formatCurrency(series.retailPrice * series.totalVolumes)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={statusInfo.variant} className="px-3 py-1">
                  {statusInfo.label}
                </Badge>
                {series.publishing && (
                  <Badge variant="success" className="px-3 py-1">
                    Publishing
                  </Badge>
                )}
                <EditSeriesModal series={series} />
              </div>
            </div>

            {series.description && (
              <p className="text-foreground-muted mb-6 max-w-2xl">
                {series.description}
              </p>
            )}

            {/* Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <ProgressBar
                  value={stats.ownedProgress}
                  variant="accent"
                  size="md"
                  label="Collection Progress"
                  showPercentage
                />
                <p className="text-sm text-foreground-muted mt-2">
                  {stats.owned} of {stats.total} volumes owned
                </p>
              </div>
              <div>
                <ProgressBar
                  value={stats.readProgress}
                  variant="success"
                  size="md"
                  label="Reading Progress"
                  showPercentage
                />
                <p className="text-sm text-foreground-muted mt-2">
                  {stats.read} of {stats.owned} owned volumes read
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="animate-fade-in stagger-1">
          <StatsCard
            title="Owned"
            value={stats.owned}
            icon={Package}
            variant="accent"
          />
        </div>
        <div className="animate-fade-in stagger-2">
          <StatsCard
            title="Read"
            value={stats.read}
            icon={BookMarked}
            variant="success"
          />
        </div>
        <div className="animate-fade-in stagger-3">
          <StatsCard
            title="Missing"
            value={stats.missing}
            icon={BookOpen}
            variant="default"
          />
        </div>
        <div className="animate-fade-in stagger-4">
          <StatsCard
            title="Total Spent"
            value={formatCurrency(stats.totalSpent)}
            subtitle={`${formatCurrency(stats.averagePrice)} avg`}
            icon={Wallet}
            variant="warning"
          />
        </div>
        <div className="animate-fade-in stagger-5">
          <StatsCard
            title="Savings"
            value={formatCurrency(stats.savings)}
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

      {/* Volume Grid */}
      <div className="glass rounded-2xl p-6 animate-fade-in stagger-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Volumes</h2>
            <p className="text-sm text-foreground-muted mt-1">
              Click the icons to toggle owned/read status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <BulkSetReadModal volumes={series.volumes} />
            <BulkMarkOwnedModal volumes={series.volumes} />
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6 p-4 bg-background-tertiary/50 rounded-xl border border-border/50">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-background-tertiary ring-1 ring-border" />
              <span className="text-foreground-muted">Not owned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-linear-to-br from-accent/20 to-accent/5 ring-2 ring-accent/50" />
              <span className="text-foreground-muted">Owned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-linear-to-br from-success/20 to-success/5 ring-2 ring-success/50" />
              <span className="text-foreground-muted">Read</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Package className="w-4 h-4 text-foreground-muted" />
              <span className="text-foreground-muted">Mark owned</span>
            </div>
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-foreground-muted" />
              <span className="text-foreground-muted">Mark read</span>
            </div>
          </div>
        </div>

        <VolumeGrid
          volumes={series.volumes}
          totalVolumes={series.totalVolumes}
          seriesDefaults={{
            retailPrice: series.retailPrice,
          }}
        />
      </div>
    </div>
  );
}
