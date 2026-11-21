import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { Skeleton } from "@/components/ui/skeletons";

export default function DashboardLoading() {
  return (
    <div className="p-4 lg:p-8">
      <div className="mx-auto max-w-[1200px]">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
        <DashboardSkeleton />
      </div>
    </div>
  );
}
