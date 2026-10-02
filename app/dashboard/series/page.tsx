import { getAllSeries, type SortOption } from "@/actions/series";
import { getPublishers } from "@/actions/publishers";
import { AddSeriesModal } from "@/components/series/add-series-modal";
import { SeriesCard } from "@/components/series/series-card";
import { SeriesFilters } from "@/components/series/series-filters";
import { Pagination } from "@/components/ui/pagination";
import { SeriesGridSkeleton } from "@/components/ui/skeletons";
import { SeriesStatus } from "@/lib/generated/prisma/enums";
import { Library } from "lucide-react";
import { Suspense } from "react";

const PAGE_SIZE = 20;

const SORT_OPTIONS: SortOption[] = [
  "updated",
  "title_asc",
  "title_desc",
  "created",
  "completion",
  "spent",
];

type Props = {
  searchParams: Promise<{ status?: string; q?: string; sort?: string; page?: string }>;
};

type FilteredSeriesListProps = {
  statusFilter?: SeriesStatus;
  searchQuery?: string;
  sort?: SortOption;
  page: number;
};

async function FilteredSeriesList({
  statusFilter,
  searchQuery,
  sort,
  page,
}: FilteredSeriesListProps) {
  const series = await getAllSeries(statusFilter, sort, searchQuery);

  const totalCount = series.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginatedSeries = series.slice(start, start + PAGE_SIZE);

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
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {paginatedSeries.map((s) => (
          <SeriesCard key={s.id} series={s} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}
    </div>
  );
}

export default async function SeriesPage({ searchParams }: Props) {
  const [{ status, q, sort, page }, publishers] = await Promise.all([
    searchParams,
    getPublishers(),
  ]);
  // URL params are user-editable: ignore values we don't recognise.
  const statusFilter = (Object.values(SeriesStatus) as string[]).includes(status ?? "")
    ? (status as SeriesStatus)
    : undefined;
  const searchQuery = q?.trim() || undefined;
  const sortOption = SORT_OPTIONS.includes(sort as SortOption)
    ? (sort as SortOption)
    : undefined;
  const parsedPage = parseInt(page ?? "", 10);
  const currentPage = Number.isFinite(parsedPage) ? parsedPage : 1;

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Series</h1>
          <p className="text-foreground-muted mt-1">
            Manage your manga collection
          </p>
        </div>
        <AddSeriesModal publishers={publishers} />
      </div>

      {/* Filters */}
      <div className="mb-8">
        <Suspense fallback={null}>
          <SeriesFilters />
        </Suspense>
      </div>

      <Suspense fallback={<SeriesGridSkeleton />}>
        <FilteredSeriesList
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          sort={sortOption}
          page={currentPage}
        />
      </Suspense>
    </div>
  );
}
