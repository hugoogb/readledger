import { getAllSeries } from "@/actions/series";
import { AddSeriesModal } from "@/components/series/add-series-modal";
import { SeriesCard, SeriesWithVolumes } from "@/components/series/series-card";
import { SeriesFilters } from "@/components/series/series-filters";
import { SeriesStatus } from "@/lib/generated/prisma/enums";
import { Library } from "lucide-react";
import { Suspense } from "react";

type Props = {
  searchParams: { status?: string; q?: string };
};

type SeriesListProps = {
  series: SeriesWithVolumes[];
  statusFilter?: SeriesStatus;
  searchQuery?: string;
};

async function SeriesList({
  series,
  statusFilter,
  searchQuery,
}: SeriesListProps) {
  if (series.length === 0) {
    return (
      <div className="text-center py-16">
        <Library className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No series found</h3>
        <p className="text-foreground-muted">
          {statusFilter || searchQuery
            ? "Try adjusting your filters"
            : "Add your first manga series to get started"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {series.map((s, index) => (
        <div
          key={s.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <SeriesCard series={s} />
        </div>
      ))}
    </div>
  );
}

export default async function SeriesPage({ searchParams }: Props) {
  const { status, q } = await searchParams;
  const statusFilter = status as SeriesStatus | undefined;
  const searchQuery = q?.toLowerCase();

  let series = await getAllSeries(statusFilter);

  if (searchQuery) {
    series = series.filter(
      (s) =>
        s.title.toLowerCase().includes(searchQuery) ||
        s.author?.toLowerCase().includes(searchQuery),
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">My Series</h1>
          <p className="text-foreground-muted mt-1">
            Manage your manga collection
          </p>
        </div>
        <AddSeriesModal />
      </div>

      {/* Filters */}
      <div className="mb-8 animate-fade-in stagger-1">
        <Suspense fallback={null}>
          <SeriesFilters />
        </Suspense>
      </div>

      <SeriesList
        series={series}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
      />
    </div>
  );
}
