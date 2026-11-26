import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { isStandalone } from "@/lib/format";
import { isbnVariants } from "@/lib/isbn";
import { lookupIsbnAnySource } from "@/lib/isbn-lookup";
import { logger } from "@/lib/logger";
import { errorMessage } from "@/lib/utils";
import {
  findTopManga,
  formatMangaForSeries,
  type FormattedMangaData,
  type MangaSearchResult,
} from "@/lib/manga-api";
import { normalizeTitle, parseVolumeTitle } from "@/lib/volume-title";
import { startOfUtcDay } from "@/utils/date";

export type KnownVolume = { seriesId: string; seriesTitle: string; volumeNumber: number; owned: boolean };

export async function findVolumeByIsbn(userId: string, isbn13: string): Promise<KnownVolume | null> {
  const volume = await prisma.volume.findFirst({
    where: { isbn: { in: isbnVariants(isbn13) }, series: { userId } },
    select: { seriesId: true, volumeNumber: true, owned: true, series: { select: { title: true } } },
  });
  if (!volume) return null;
  return {
    seriesId: volume.seriesId,
    seriesTitle: volume.series.title,
    volumeNumber: volume.volumeNumber,
    owned: volume.owned,
  };
}

export async function listMultiVolumeSeries(
  userId: string,
): Promise<Array<{ id: string; title: string; totalVolumes: number | null }>> {
  const series = await prisma.series.findMany({
    where: { userId },
    select: { id: true, title: true, totalVolumes: true, _count: { select: { volumes: true } } },
    orderBy: { title: "asc" },
  });
  return series
    .filter((s) => !isStandalone(s.totalVolumes, s._count.volumes))
    .map(({ id, title, totalVolumes }) => ({ id, title, totalVolumes }));
}

export async function findSeriesByTitle(
  userId: string,
  normalized: string,
): Promise<{ id: string; title: string } | null> {
  const match = (await listMultiVolumeSeries(userId)).find((s) => normalizeTitle(s.title) === normalized);
  return match ? { id: match.id, title: match.title } : null;
}

export async function markVolumeOwnedByIsbn(
  userId: string,
  seriesId: string,
  volumeNumber: number,
  isbn13: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const series = await tx.series.findFirst({
      where: { id: seriesId, userId },
      select: { id: true, totalVolumes: true },
    });
    if (!series) throw new NotFoundError("Series");

    const existing = await tx.volume.findFirst({
      where: { seriesId, volumeNumber },
      select: { id: true, purchaseDate: true },
    });

    await tx.volume.updateMany({
      where: {
        series: { userId },
        isbn: { in: isbnVariants(isbn13) },
        ...(existing && { NOT: { id: existing.id } }),
      },
      data: { isbn: null },
    });

    const owned = { owned: true, wishlist: false, isbn: isbn13 };
    if (existing) {
      await tx.volume.update({
        where: { id: existing.id },
        data: existing.purchaseDate ? owned : { ...owned, purchaseDate: startOfUtcDay() },
      });
    } else {
      await tx.volume.create({
        data: { seriesId, volumeNumber, ...owned, purchaseDate: startOfUtcDay() },
      });
    }

    if (series.totalVolumes !== null && series.totalVolumes < volumeNumber) {
      const gap = [];
      for (let n = series.totalVolumes + 1; n < volumeNumber; n++) gap.push({ seriesId, volumeNumber: n });
      if (gap.length > 0) await tx.volume.createMany({ data: gap, skipDuplicates: true });
      await tx.series.update({ where: { id: seriesId }, data: { totalVolumes: volumeNumber } });
    }
  });
}

export type VolumeMatch =
  | {
      kind: "existing";
      seriesId: string;
      seriesTitle: string;
      volumeNumber: number;
      owned: boolean;
      isbn: string;
      byIsbn: boolean;
    }
  | {
      kind: "new";
      manga: FormattedMangaData;
      volumeNumber: number;
      totalVolumes: number | null;
      useMangadexCovers: boolean;
      isbn: string;
    };

async function guessedVolume(
  series: { id: string; title: string },
  volumeNumber: number,
  isbn: string,
): Promise<VolumeMatch> {
  const volume = await prisma.volume.findFirst({
    where: { seriesId: series.id, volumeNumber },
    select: { owned: true },
  });
  return {
    kind: "existing",
    seriesId: series.id,
    seriesTitle: series.title,
    volumeNumber,
    owned: volume?.owned ?? false,
    isbn,
    byIsbn: false,
  };
}

async function findMangaByTitle(seriesTitle: string): Promise<MangaSearchResult | null> {
  const wanted = normalizeTitle(seriesTitle);
  const top = await findTopManga(seriesTitle);
  if (!top) return null;
  const names = [top.title, ...top.altTitles];
  return names.some((n) => normalizeTitle(n) === wanted) ? top : null;
}

export async function resolveIsbnVolume(userId: string, isbn13: string): Promise<VolumeMatch | null> {
  try {
    const known = await findVolumeByIsbn(userId, isbn13);
    if (known) return { kind: "existing", ...known, isbn: isbn13, byIsbn: true };

    const book = await lookupIsbnAnySource(isbn13);
    const parsed =
      book && (parseVolumeTitle(book.title) ?? (book.editionTitle ? parseVolumeTitle(book.editionTitle) : null));
    if (!parsed) return null;
    const { volumeNumber } = parsed;

    const inLibrary = await findSeriesByTitle(userId, normalizeTitle(parsed.seriesTitle));
    if (inLibrary) return guessedVolume(inLibrary, volumeNumber, isbn13);

    const manga = await findMangaByTitle(parsed.seriesTitle);
    if (!manga) return null;

    const existing = await prisma.series.findFirst({
      where: { userId, mangadexId: manga.id },
      select: { id: true, title: true, totalVolumes: true, _count: { select: { volumes: true } } },
    });
    if (existing) {
      if (isStandalone(existing.totalVolumes, existing._count.volumes)) return null;
      return guessedVolume(existing, volumeNumber, isbn13);
    }

    const totalVolumes = parsed.totalVolumes ?? manga.lastVolume;
    return {
      kind: "new",
      manga: formatMangaForSeries(manga),
      volumeNumber,
      totalVolumes,
      useMangadexCovers: parsed.totalVolumes === null || parsed.totalVolumes === manga.lastVolume,
      isbn: isbn13,
    };
  } catch (error) {
    logger.error("Error resolving an ISBN to a volume", {
      error: errorMessage(error),
    });
    return null;
  }
}
