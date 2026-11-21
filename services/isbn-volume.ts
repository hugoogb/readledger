import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { isStandalone } from "@/lib/format";
import { isbnVariants } from "@/lib/isbn";
import { normalizeTitle } from "@/lib/volume-title";
import { startOfUtcDay } from "@/utils/date";

export type KnownVolume = { seriesId: string; seriesTitle: string; volumeNumber: number; owned: boolean };

/** The user's volume holding this ISBN (either form), or null. */
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

/** Series a scanned volume can belong to: everything except standalone books. */
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

/** The first multi-volume series whose normalised title equals `normalized`. */
export async function findSeriesByTitle(
  userId: string,
  normalized: string,
): Promise<{ id: string; title: string } | null> {
  const match = (await listMultiVolumeSeries(userId)).find((s) => normalizeTitle(s.title) === normalized);
  return match ? { id: match.id, title: match.title } : null;
}

/**
 * Marks volume `volumeNumber` of the series owned and stores the scanned ISBN
 * on it, creating the row when missing (a newly released volume). An ISBN
 * belongs to one volume per user, so it's cleared from any other volume.
 */
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
      await tx.series.update({ where: { id: seriesId }, data: { totalVolumes: volumeNumber } });
    }
  });
}
