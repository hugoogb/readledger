import Link from "next/link";
import { BookMarked, BookOpen, Package, User } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import Image from "next/image";
import type { SeriesCardData } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statusConfig } from "@/lib/constants";
import { FORMAT_LABELS, isStandalone } from "@/lib/format";

type SeriesCardProps = {
  series: SeriesCardData;
  /** Show the format badge; only useful when the library mixes formats. */
  showFormat?: boolean;
};

/** Compact on/off state for a standalone book, e.g. "Owned" / "Not owned". */
function StatePill({
  on,
  icon: Icon,
  onLabel,
  offLabel,
  tone,
}: {
  on: boolean;
  icon: typeof Package;
  onLabel: string;
  offLabel: string;
  tone: "accent" | "success";
}) {
  const onClass = tone === "accent" ? "bg-accent/15 text-accent" : "bg-success/15 text-success";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${
        on ? onClass : "bg-background-tertiary text-foreground-muted"
      }`}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      {on ? onLabel : offLabel}
    </span>
  );
}

export function SeriesCard({ series, showFormat = false }: SeriesCardProps) {
  const standalone = isStandalone(series.totalVolumes, series.volumes.length);
  const owned = series.volumes.filter((v) => v.owned).length;
  const read = series.volumes.filter((v) => v.read).length;
  const total = series.totalVolumes || series.volumes.length;
  const ownedProgress = total > 0 ? (owned / total) * 100 : 0;
  const readProgress = owned > 0 ? (read / owned) * 100 : 0;
  const statusInfo = statusConfig[series.status] || statusConfig.READING;

  return (
    <Link
      href={`/dashboard/library/${series.id}`}
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
              // Matches the grid: 2 cols on phones, up to 5 on wide screens.
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-background-tertiary flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-foreground-muted/30" />
            </div>
          )}
          {/* Format + status badges, stacked so they never collide on narrow cards */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
            {showFormat && (
              <Badge variant="secondary" className="bg-black/60 text-white border-none">
                {FORMAT_LABELS[series.format]}
              </Badge>
            )}
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            {series.publishing && <Badge variant="success">Publishing</Badge>}
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

          {standalone ? (
            <div className="flex flex-wrap gap-1.5">
              <StatePill
                on={owned > 0}
                icon={Package}
                onLabel="Owned"
                offLabel="Not owned"
                tone="accent"
              />
              <StatePill
                on={read > 0}
                icon={BookMarked}
                onLabel="Read"
                offLabel="Unread"
                tone="success"
              />
            </div>
          ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider mb-1.5 text-foreground-muted">
                <span>Owned</span>
                <span className="text-foreground">
                  {owned}/{total}
                </span>
              </div>
              <ProgressBar
                value={ownedProgress}
                variant="accent"
                size="sm"
                className="h-1.5"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider mb-1.5 text-foreground-muted">
                <span>Read</span>
                <span className="text-foreground">
                  {read}/{owned}
                </span>
              </div>
              <ProgressBar
                value={readProgress}
                variant="success"
                size="sm"
                className="h-1.5"
              />
            </div>
          </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
