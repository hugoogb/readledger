import { getAllSeries, getLibraryFormats, type SortOption } from "@/actions/series";
import { AddBookButton } from "@/components/series/add-book-provider";
import { SeriesCard } from "@/components/series/series-card";
import { SeriesFilters } from "@/components/series/series-filters";
import { Pagination } from "@/components/ui/pagination";
import { SeriesGridSkeleton } from "@/components/ui/skeletons";
import { parseFormat } from "@/lib/format";
import { type Format, SeriesStatus } from "@/lib/generated/prisma/enums";
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
  searchParams: Promise<{ status?: string; format?: string; q?: string; sort?: string; page?: string }>;
};

type FilteredSeriesListProps = {
  statusFilter?: SeriesStatus;
  formatFilter?: Format;
  showFormat: boolean;
  searchQuery?: string;
  sort?: SortOption;
  page: number;
};

async function FilteredSeriesList({
  statusFilter,
  formatFilter,
  showFormat,
  searchQuery,
  sort,
  page,
}: FilteredSeriesListProps) {
  const series = await getAllSeries({
    status: statusFilter,
    format: formatFilter,
    sort,
    search: searchQuery,
  });

  const totalCount = series.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginatedSeries = series.slice(start, start + PAGE_SIZE);

  if (series.length === 0) {
    return (
      <div className="border-t-2 border-foreground py-8">
        <h3 className="font-serif text-2xl font-medium">
          {statusFilter || formatFilter || searchQuery ? "Nothing found" : "Nothing here yet"}
        </h3>
        <p className="mt-1 text-foreground-muted">
          {statusFilter || formatFilter || searchQuery
            ? "Try adjusting your filters"
            : "Add your first book or series"}
        </p>
        {!(statusFilter || formatFilter || searchQuery) && (
          <AddBookButton className="mt-5" label="Add your first book" />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 xl:grid-cols-5">
        {paginatedSeries.map((s) => (
          <SeriesCard key={s.id} series={s} showFormat={showFormat} />
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
  const [{ status, format, q, sort, page }, formats] = await Promise.all([
    searchParams,
    getLibraryFormats(),
  ]);
  const statusFilter = (Object.values(SeriesStatus) as string[]).includes(status ?? "")
    ? (status as SeriesStatus)
    : undefined;
  const parsedFormat = parseFormat(format);
  const formatFilter = parsedFormat && formats.includes(parsedFormat) ? parsedFormat : undefined;
  const searchQuery = q?.trim() || undefined;
  const sortOption = SORT_OPTIONS.includes(sort as SortOption)
    ? (sort as SortOption)
    : undefined;
  const parsedPage = parseInt(page ?? "", 10);
  const currentPage = Number.isFinite(parsedPage) ? parsedPage : 1;

  return (
    <div className="mx-auto max-w-[1200px] p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-medium">Library</h1>
          <p className="text-foreground-muted mt-1">
            Everything on your shelves
          </p>
        </div>
        <AddBookButton className="hidden lg:inline-flex" />
      </div>

      <div className="mb-8">
        <Suspense fallback={null}>
          <SeriesFilters formats={formats} />
        </Suspense>
      </div>

      <Suspense fallback={<SeriesGridSkeleton />}>
        <FilteredSeriesList
          statusFilter={statusFilter}
          formatFilter={formatFilter}
          showFormat={formats.length > 1}
          searchQuery={searchQuery}
          sort={sortOption}
          page={currentPage}
        />
      </Suspense>
    </div>
  );
}
