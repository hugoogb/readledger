import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-background-tertiary",
        className,
      )}
    />
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-background-secondary p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="w-12 h-12 rounded-md" />
      </div>
    </div>
  );
}

export function SeriesCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-2/3 rounded-[3px]" />
      <Skeleton className="mt-2.5 h-4 w-3/4" />
      <Skeleton className="mt-1.5 h-3 w-1/2" />
      <Skeleton className="mt-1.5 h-3 w-2/3" />
    </div>
  );
}

export function VolumeGridSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-2">
      {Array.from({ length: 20 }).map((_, i) => (
        <Skeleton key={i} className="aspect-3/4" />
      ))}
    </div>
  );
}

export function ProgressSectionSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-background-secondary p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-md" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-52" />
        </div>
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-12" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RecentSeriesListSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="rounded-lg border border-border bg-background-secondary p-6 space-y-3">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-5 w-6" />
          </div>
        ))}
      </div>
      <div className="lg:col-span-2 rounded-lg border border-border bg-background-secondary p-6 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <Skeleton className="w-12 h-16 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SeriesGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <SeriesCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SeriesDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Cover + Info */}
      <div className="flex flex-col lg:flex-row gap-8">
        <Skeleton className="w-48 aspect-3/4 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Volume Grid */}
      <div className="rounded-lg border border-border bg-background-secondary p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-52" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        </div>
        <VolumeGridSkeleton />
      </div>
    </div>
  );
}

export function ChartGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-background-secondary p-4 sm:p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ))}
    </div>
  );
}

/** Placeholder for a Ledger: label/value rows over hairlines. */
export function LedgerSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="border-t border-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-3 border-b border-border">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-14" />
        </div>
      ))}
    </div>
  );
}

/** Placeholder for a CoverShelf: a row of 2:3 covers. */
export function CoverShelfSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden lg:grid lg:grid-cols-6 lg:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-[72px] shrink-0 lg:w-auto">
          <Skeleton className="aspect-2/3 w-full rounded-[3px]" />
          <Skeleton className="mt-2 h-3 w-12" />
        </div>
      ))}
    </div>
  );
}
