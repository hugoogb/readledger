import { Format, SeriesStatus } from "./generated/prisma/enums";

/**
 * Book formats and the "standalone book" rules shared by services and UI.
 * In code a Series row is a "title": a standalone book or a series of volumes.
 */

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

/**
 * A title is a standalone book when it has exactly one volume and at most one
 * volume row. Several rows render as a series so no data is hidden; an unknown
 * total (null) is an ongoing series that has just started.
 */
export function isStandalone(totalVolumes: number | null, volumeCount: number): boolean {
  return totalVolumes === 1 && volumeCount <= 1;
}

/** How a single volume is named in lists: "Dune", or "One Piece · Vol 3". */
export function volumeLabel(title: string, volumeNumber: number, standalone: boolean): string {
  return standalone ? title : `${title} · Vol ${volumeNumber}`;
}

/**
 * Status a standalone book moves to when its read flag changes, or null to
 * leave it. Reading it completes it; un-reading only reopens a completed book.
 */
export function standaloneStatusAfterRead(
  status: SeriesStatus,
  read: boolean,
): SeriesStatus | null {
  if (read) return status === SeriesStatus.COMPLETED ? null : SeriesStatus.COMPLETED;
  return status === SeriesStatus.COMPLETED ? SeriesStatus.READING : null;
}

/** A Format from user input (URL param, import cell), or undefined. */
export function parseFormat(value: string | undefined | null): Format | undefined {
  const s = value?.trim().toUpperCase() ?? "";
  return (FORMATS as string[]).includes(s) ? (s as Format) : undefined;
}

/** Owned books per format, largest first. */
export function formatBreakdown(series: { format: Format; ownedCount: number }[]) {
  const counts = new Map<Format, number>();
  for (const s of series) counts.set(s.format, (counts.get(s.format) ?? 0) + s.ownedCount);
  return [...counts.entries()]
    .map(([format, count]) => ({ format, label: FORMAT_LABELS[format], count }))
    .sort((a, b) => b.count - a.count || FORMATS.indexOf(a.format) - FORMATS.indexOf(b.format));
}
