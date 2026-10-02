import { Skeleton } from "@/components/ui/skeletons";

export default function ProfileLoading() {
  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-48 mt-2" />
      </div>

      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    </div>
  );
}
