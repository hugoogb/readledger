import data from "./manga-series.json";

export type MangaSeries = {
  slug: string;
  title: string;
  authors: string[];
  mangadexId: string;
  year: number | null;
  demographic: string | null;
  status: string;
  volumes: number;
  exact: boolean;
  note: string;
};

export const MANGA_DATA_CHECKED_ON = data.checkedOn;
export const mangaSeries: MangaSeries[] = data.series;

export function getMangaSeries(slug: string): MangaSeries | undefined {
  return mangaSeries.find((series) => series.slug === slug);
}

export function formatVolumeCount(series: MangaSeries): string {
  return `${series.volumes}${series.exact ? "" : "+"}`;
}

const STATUS_LABELS: Record<string, string> = {
  completed: "Finished",
  ongoing: "Ongoing",
  hiatus: "On hiatus",
  cancelled: "Cancelled",
};

export function statusLabel(series: MangaSeries): string {
  return STATUS_LABELS[series.status] ?? series.status;
}

export function relatedSeries(series: MangaSeries, count = 4): MangaSeries[] {
  const others = mangaSeries.filter((other) => other.slug !== series.slug);
  const start = mangaSeries.indexOf(series);
  const rotated = [...others.slice(start), ...others.slice(0, start)];
  const same = rotated.filter((other) => other.demographic === series.demographic);
  const rest = rotated.filter((other) => other.demographic !== series.demographic);
  return [...same, ...rest].slice(0, count);
}
