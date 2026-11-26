import { Format, SeriesStatus } from "./generated/prisma/enums";

export const FORMAT_LABELS: Record<Format, string> = {
  MANGA: "Manga",
  LIGHT_NOVEL: "Light novel",
  COMIC: "Comic",
  NOVEL: "Novel",
  NONFICTION: "Non-fiction",
  OTHER: "Other",
};

const FORMATS = Object.values(Format);

export const formatOptions = FORMATS.map((value) => ({ value, label: FORMAT_LABELS[value] }));

export function isStandalone(totalVolumes: number | null, volumeCount: number): boolean {
  return totalVolumes === 1 && volumeCount <= 1;
}

export function volumeLabel(title: string, volumeNumber: number, standalone: boolean): string {
  return standalone ? title : `${title} · Vol ${volumeNumber}`;
}

export function standaloneStatusAfterRead(
  status: SeriesStatus,
  read: boolean,
): SeriesStatus | null {
  if (read) return status === SeriesStatus.COMPLETED ? null : SeriesStatus.COMPLETED;
  return status === SeriesStatus.COMPLETED ? SeriesStatus.READING : null;
}

export function parseFormat(value: string | undefined | null): Format | undefined {
  const s = value?.trim().toUpperCase() ?? "";
  return (FORMATS as string[]).includes(s) ? (s as Format) : undefined;
}

export function formatBreakdown(series: { format: Format; ownedCount: number }[]) {
  const counts = new Map<Format, number>();
  for (const s of series) counts.set(s.format, (counts.get(s.format) ?? 0) + s.ownedCount);
  return [...counts.entries()]
    .map(([format, count]) => ({ format, label: FORMAT_LABELS[format], count }))
    .sort((a, b) => b.count - a.count || FORMATS.indexOf(a.format) - FORMATS.indexOf(b.format));
}

const MANGA_GROUP: Format[] = [Format.MANGA, Format.LIGHT_NOVEL];

export function booksFirstInSearch(counts: Partial<Record<Format, number>>): boolean {
  let manga = 0;
  let other = 0;
  for (const [format, count] of Object.entries(counts) as [Format, number][]) {
    if (MANGA_GROUP.includes(format)) manga += count;
    else other += count;
  }
  return other >= manga;
}

export function seriesCaption({
  standalone,
  owned,
  read,
  total,
}: {
  standalone: boolean;
  owned: number;
  read: number;
  total: number;
}): string {
  if (!standalone) return `${owned} / ${total} owned · ${read} read`;
  if (owned === 0) return "Not owned";
  return read > 0 ? "Owned · Read" : "Owned · Unread";
}
