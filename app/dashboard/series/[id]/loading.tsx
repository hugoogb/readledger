import { SeriesDetailSkeleton } from "@/components/ui/skeletons";

export default function SeriesDetailLoading() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="h-4 w-28 rounded-lg bg-background-tertiary/60 animate-pulse mb-4" />
        <SeriesDetailSkeleton />
      </div>
    </div>
  );
}
