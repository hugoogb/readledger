import { SeriesGridSkeleton } from "@/components/ui/skeletons";

export default function SeriesLoading() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="h-8 w-32 rounded-xl bg-background-tertiary/60 animate-pulse" />
          <div className="h-4 w-56 rounded-lg bg-background-tertiary/60 animate-pulse mt-2" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-background-tertiary/60 animate-pulse" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="h-12 flex-1 rounded-xl bg-background-tertiary/60 animate-pulse" />
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-12 w-24 rounded-xl bg-background-tertiary/60 animate-pulse"
            />
          ))}
        </div>
      </div>

      <SeriesGridSkeleton count={10} />
    </div>
  );
}
