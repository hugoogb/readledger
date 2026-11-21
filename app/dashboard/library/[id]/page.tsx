import { getPublishers } from "@/actions/publishers";
import { getSeries } from "@/actions/series";
import { getStores } from "@/actions/stores";
import { getVolumeStats } from "@/actions/volumes";
import { BookPanel } from "@/components/books/book-panel";
import { EditSeriesModal } from "@/components/series/edit-series-modal";
import { SeriesTimeline } from "@/components/series/series-timeline";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { LedgerSkeleton } from "@/components/ui/skeletons";
import { Ledger, LedgerRow, LedgerTotal } from "@/components/ui/ledger";
import { CoverImage } from "@/components/books/cover-image";
import { BulkMarkOwnedModal } from "@/components/volumes/bulk-mark-owned-modal";
import { BulkSetReadModal } from "@/components/volumes/bulk-set-read-modal";
import { VolumeGrid } from "@/components/volumes/volume-grid";
import { statusConfig } from "@/lib/constants";
import { FORMAT_LABELS, isStandalone } from "@/lib/format";
import { Format } from "@/lib/generated/prisma/enums";
import { getFormatCurrency } from "@/lib/currency";
import { ArrowLeft, BookMarked, Heart, Package } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const series = await getSeries(id);

  if (!series) {
    return {
      title: "Not Found",
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

async function SeriesLedger({ seriesId }: { seriesId: string }) {
  const [stats, formatCurrency] = await Promise.all([
    getVolumeStats(seriesId),
    getFormatCurrency(),
  ]);

  return (
    <Ledger className="mb-10 max-w-[40rem]">
      <LedgerRow label="Owned" note={`of ${stats.total}`} value={stats.owned} />
      <LedgerRow label="Read" value={stats.read} />
      <LedgerRow label="Missing" value={stats.missing} />
      {stats.savings > 0 && (
        <LedgerRow
          label="Saved buying used"
          note={stats.savingsPercentage > 0 ? `${stats.savingsPercentage.toFixed(0)}%` : undefined}
          value={formatCurrency(stats.savings)}
        />
      )}
      <LedgerTotal
        label={`Spent · ${formatCurrency(stats.averagePrice)} avg`}
        value={formatCurrency(stats.totalSpent)}
      />
    </Ledger>
  );
}

async function SeriesProgressSection({ seriesId }: { seriesId: string }) {
  const stats = await getVolumeStats(seriesId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div>
        <ProgressBar
          value={stats.ownedProgress}
          variant="accent"
          size="md"
          label="Collection progress"
          showPercentage
        />
        <p className="text-sm text-foreground-muted mt-2">
          {stats.owned} of {stats.total} volumes owned
        </p>
      </div>
      <div>
        <ProgressBar
          value={stats.readProgress}
          variant="gilt"
          size="md"
          label="Reading progress"
          showPercentage
        />
        <p className="text-sm text-foreground-muted mt-2">
          {stats.read} of {stats.owned} owned volumes read
        </p>
      </div>
    </div>
  );
}

export default async function SeriesDetailPage({ params }: Props) {
  const { id } = await params;
  const [series, publishers, stores, formatCurrency] = await Promise.all([
    getSeries(id),
    getPublishers(),
    getStores(),
    getFormatCurrency(),
  ]);

  if (!series) {
    notFound();
  }

  const statusInfo = statusConfig[series.status] || statusConfig.READING;
  // A standalone book shows its single copy instead of a volume grid. The
  // migration and the series service guarantee the row exists.
  const book = isStandalone(series.totalVolumes, series.volumes.length)
    ? series.volumes[0]
    : undefined;

  return (
    <div className="mx-auto max-w-[1200px] p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/library"
          className="inline-flex items-center gap-2 py-2 -my-2 text-foreground-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Library
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cover */}
          <div className="w-36 shrink-0 sm:w-44">
            <CoverImage src={series.coverImage} title={series.title} sizes="176px" priority />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div>
                <h1 className="mb-1.5 font-serif text-3xl font-medium leading-tight lg:text-4xl">
                  {series.title}
                </h1>
                <p className="flex flex-wrap gap-x-2 text-foreground-muted">
                  {[
                    series.author,
                    series.publisher?.name,
                    series.retailPrice &&
                      `${formatCurrency(series.retailPrice)}${book ? " retail" : " retail per volume"}`,
                    !book &&
                      series.retailPrice &&
                      series.totalVolumes &&
                      `${formatCurrency(series.retailPrice * series.totalVolumes)} retail in total`,
                  ]
                    .filter(Boolean)
                    .map((part, i, parts) => (
                      <span key={i}>
                        {part}
                        {/* Trailing dots, so a wrapped line never starts with one. */}
                        {i < parts.length - 1 && (
                          <span aria-hidden="true" className="ml-2">
                            ·
                          </span>
                        )}
                      </span>
                    ))}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary" className="px-3 py-1">
                  {FORMAT_LABELS[series.format]}
                </Badge>
                <Badge variant={statusInfo.variant} className="px-3 py-1">
                  {statusInfo.label}
                </Badge>
                {series.publishing && (
                  <Badge variant="success" className="px-3 py-1">
                    Publishing
                  </Badge>
                )}
                <EditSeriesModal series={series} publishers={publishers} />
              </div>
            </div>

            {series.description && (
              <p className="text-foreground-muted mb-6 max-w-2xl">
                {series.description}
              </p>
            )}

            {book ? (
              <>
                <BookPanel
                  volume={book}
                  title={series.title}
                  retailPrice={series.retailPrice}
                  stores={stores}
                />
                {/* A CSV import that lists only volume 1 of a manga leaves
                    totalVolumes = 1, so it shows as a single book. */}
                {(series.format === Format.MANGA || series.format === Format.LIGHT_NOVEL) && (
                  <div className="mt-2">
                    <EditSeriesModal series={series} publishers={publishers} variant="seriesHint" />
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Progress Bars */}
                <Suspense fallback={null}>
                  <SeriesProgressSection seriesId={id} />
                </Suspense>

                <SeriesTimeline volumes={series.volumes} />
              </>
            )}
          </div>
        </div>
      </div>

      {!book && (
      <>

      <Suspense fallback={<LedgerSkeleton rows={5} />}>
        <SeriesLedger seriesId={id} />
      </Suspense>

      {/* Volume Grid */}
      <section>
        <div className="flex items-end justify-between flex-wrap gap-4 mb-5 border-b border-border pb-4">
          <div>
            <h2 className="font-serif text-xl font-medium">Volumes</h2>
            <p className="text-sm text-foreground-muted mt-1">
              Tap a volume for details, or use the icons to mark it
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-3">
            <BulkSetReadModal volumes={series.volumes} />
            <BulkMarkOwnedModal volumes={series.volumes} stores={stores} />
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-5 w-3.5 rounded-[2px] border border-dashed border-border-hover" />
              <span className="text-foreground-muted">Not owned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-3.5 rounded-[2px] bg-accent-muted ring-2 ring-accent/70" />
              <span className="text-foreground-muted">Owned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-3.5 rounded-[2px] bg-success/10 ring-2 ring-success/70" />
              <span className="text-foreground-muted">Read</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-3.5 rounded-[2px] bg-error/10 ring-2 ring-error/60" />
              <span className="text-foreground-muted">Wishlisted</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Heart className="w-4 h-4 text-foreground-muted" />
              <span className="text-foreground-muted">Wishlist</span>
            </div>
            <div className="flex items-center gap-2">
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
          stores={stores}
        />
      </section>
      </>
      )}
    </div>
  );
}
