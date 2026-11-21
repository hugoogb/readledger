import { CoverShelfSkeleton, LedgerSkeleton, Skeleton } from "@/components/ui/skeletons";

export function ShelvesSkeleton() {
  return (
    <div className="space-y-10">
      <div>
        <Skeleton className="mb-3 h-6 w-40" />
        <CoverShelfSkeleton />
      </div>
      <div>
        <Skeleton className="mb-3 h-6 w-36" />
        <CoverShelfSkeleton />
      </div>
    </div>
  );
}

/** Matches the dashboard home layout below the greeting. */
export function DashboardSkeleton() {
  return (
    <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-12">
      <div>
        <LedgerSkeleton rows={5} />
        <Skeleton className="mt-5 h-24 w-full rounded-lg" />
      </div>
      <ShelvesSkeleton />
    </div>
  );
}
