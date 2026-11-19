import { SeriesGridSkeleton } from "@/components/ui/skeletons";

export default function SeriesLoading() {
  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="h-8 w-32 rounded-xl bg-background-tertiary/60 animate-pulse" />
          <div className="h-4 w-56 rounded-lg bg-background-tertiary/60 animate-pulse mt-2" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-background-tertiary/60 animate-pulse" />
      </div>

      {/* Filters: search + sort, then status chips */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-12 flex-1 rounded-xl bg-background-tertiary/60 animate-pulse" />
          <div className="h-12 w-full sm:w-48 rounded-xl bg-background-tertiary/60 animate-pulse" />
        </div>
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-24 shrink-0 rounded-xl bg-background-tertiary/60 animate-pulse"
            />
          ))}
        </div>
      </div>

      <SeriesGridSkeleton count={10} />
    </div>
  );
}
