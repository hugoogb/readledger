import {
  DashboardStatsSkeleton,
  ProgressSectionSkeleton,
  RecentSeriesListSkeleton,
} from "@/components/ui/skeletons";

export default function DashboardLoading() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="h-8 w-40 rounded-xl bg-background-tertiary/60 animate-pulse" />
        <div className="h-4 w-64 rounded-lg bg-background-tertiary/60 animate-pulse mt-2" />
      </div>

      <DashboardStatsSkeleton />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProgressSectionSkeleton />
        <ProgressSectionSkeleton />
      </div>

      <RecentSeriesListSkeleton />
    </div>
  );
}
