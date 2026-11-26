import Link from "next/link";
import { CoverImage } from "@/components/books/cover-image";
import { statusConfig } from "@/lib/constants";
import { FORMAT_LABELS, isStandalone, seriesCaption } from "@/lib/format";
import type { SeriesCardData } from "@/types";

type SeriesCardProps = {
  series: SeriesCardData;
  showFormat?: boolean;
};

export function SeriesCard({ series, showFormat = false }: SeriesCardProps) {
  const standalone = isStandalone(series.totalVolumes, series.volumes.length);
  const owned = series.volumes.filter((v) => v.owned).length;
  const read = series.volumes.filter((v) => v.read).length;
  const total = series.totalVolumes || series.volumes.length;
  const status = statusConfig[series.status].label;

  return (
    <Link href={`/dashboard/library/${series.id}`} className="group block">
      <CoverImage
        src={series.coverImage}
        title={series.title}
        sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        className="transition-transform duration-200 group-hover:-translate-y-0.5"
      />
      <h3 className="mt-2.5 line-clamp-2 font-serif text-[1.05rem] font-medium leading-snug decoration-border-hover underline-offset-4 group-hover:underline">
        {series.title}
      </h3>
      {series.author && <p className="truncate text-sm text-foreground-muted">{series.author}</p>}
      <p className="mt-1 text-xs text-foreground-muted">
        <span className="tabular-nums text-foreground">
          {seriesCaption({ standalone, owned, read, total })}
        </span>
      </p>
      <p className="text-xs text-foreground-muted">
        {status}
        {showFormat && ` · ${FORMAT_LABELS[series.format]}`}
      </p>
    </Link>
  );
}
