import { ChartGridSkeleton, Skeleton } from "@/components/ui/skeletons";

export default function StatisticsLoading() {
  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      <div className="flex gap-2 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>

      <ChartGridSkeleton />
    </div>
  );
}
