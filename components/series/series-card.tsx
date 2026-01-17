import Link from "next/link";
import { BookOpen, User } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import Image from "next/image";
import { Series, Volume } from "@/lib/generated/prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type SeriesWithVolumes = Series & {
  volumes: Volume[];
};

type SeriesCardProps = {
  series: SeriesWithVolumes;
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" | "warning"; colorClass?: string }> = {
  READING: { label: "Reading", variant: "default" },
  COMPLETED: { label: "Completed", variant: "success" },
  ON_HOLD: { label: "On Hold", variant: "warning" },
  DROPPED: { label: "Dropped", variant: "destructive" },
  PLAN_TO_READ: { label: "Plan to Read", variant: "secondary" },
};

export function SeriesCard({ series }: SeriesCardProps) {
  const owned = series.volumes.filter((v) => v.owned).length;
  const read = series.volumes.filter((v) => v.read).length;
  const total = series.totalVolumes || series.volumes.length;
  const ownedProgress = total > 0 ? (owned / total) * 100 : 0;
  const readProgress = owned > 0 ? (read / owned) * 100 : 0;
  const statusInfo = statusConfig[series.status] || statusConfig.READING;

  return (
    <Link
      href={`/dashboard/series/${series.id}`}
      className="transition-all group"
    >
      <Card className="overflow-hidden border-none shadow-lg group-hover:shadow-2xl transition-all duration-300">
        {/* Cover */}
        <div className="aspect-3/4 relative overflow-hidden">
          {series.coverImage ? (
            <Image
              fill
              src={series.coverImage}
              alt={series.title}
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-background-tertiary flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-foreground-muted/30" />
            </div>
          )}
          {/* Status badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
            <Badge
              variant={statusInfo.variant}
            >
              {statusInfo.label}
            </Badge>
            {series.publishing && (
              <Badge
                variant="success"
              >
                Publishing
              </Badge>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 bg-linear-to-b from-background/50 to-background/80">
          <h3 className="font-bold text-lg truncate group-hover:text-accent transition-colors duration-300">
            {series.title}
          </h3>
          {series.author && (
            <p className="text-sm text-foreground-muted flex items-center gap-1.5 mb-4 font-medium italic">
              <User className="w-3.5 h-3.5" />
              {series.author}
            </p>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider mb-1.5 text-foreground-muted">
                <span>Owned</span>
                <span className="text-foreground">
                  {owned}/{total}
                </span>
              </div>
              <ProgressBar value={ownedProgress} variant="accent" size="sm" className="h-1.5" />
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider mb-1.5 text-foreground-muted">
                <span>Read</span>
                <span className="text-foreground">
                  {read}/{owned}
                </span>
              </div>
              <ProgressBar value={readProgress} variant="success" size="sm" className="h-1.5" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
