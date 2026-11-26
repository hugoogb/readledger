import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { Format, SeriesStatus } from "@/lib/generated/prisma/enums";
import type { SeriesSchema } from "@/lib/validations";
import { comparableSavings } from "@/lib/savings";
import { blankToNull } from "@/lib/normalize";
import { assertOwnedPublisher } from "@/services/ownership";
import { startOfUtcDay } from "@/utils/date";

export type CreateSeriesInput = SeriesSchema;
export type UpdateSeriesInput = Partial<SeriesSchema>;

export type VolumeInput = {
  volumeNumber: number;
  title?: string;
  coverImage?: string | null;
  isbn?: string | null;
  owned?: boolean;
};

export type SortOption = "updated" | "title_asc" | "title_desc" | "created" | "completion" | "spent";

export type LibraryQuery = {
  status?: SeriesStatus;
  format?: Format;
  sort?: SortOption;
  search?: string;
};

const CLEARABLE_FIELDS = ["author", "coverImage", "description"] as const;

const needsStandaloneVolume = (totalVolumes: number | null | undefined, volumeCount: number) =>
  totalVolumes === 1 && volumeCount === 0;

export async function createSeries(
  userId: string,
  validated: CreateSeriesInput,
  volumes: VolumeInput[] = [],
) {
  await assertOwnedPublisher(userId, validated.publisherId);

  if (needsStandaloneVolume(validated.totalVolumes, volumes.length)) {
    volumes = [{ volumeNumber: 1 }];
  }

  return prisma.series.create({
    data: {
      ...blankToNull(validated, CLEARABLE_FIELDS),
      userId,
      publisherId: validated.publisherId || null,
      volumes: {
        create: volumes.map((v) => ({
          volumeNumber: v.volumeNumber,
          title: v.title,
          coverImage: v.coverImage || null,
          isbn: v.isbn || null,
          owned: v.owned ?? false,
          purchaseDate: v.owned ? startOfUtcDay() : null,
          read: false,
        })),
      },
    },
    include: {
      volumes: true,
    },
  });
}

export async function updateSeries(userId: string, id: string, validated: UpdateSeriesInput) {
  const series = await prisma.series.findFirst({
    where: { id, userId },
    include: { volumes: { select: { volumeNumber: true } } },
  });

  if (!series) {
    throw new NotFoundError("Series");
  }

  await assertOwnedPublisher(userId, validated.publisherId);

  const updated = await prisma.series.update({
    where: { id },
    data: {
      ...blankToNull(validated, CLEARABLE_FIELDS),
      publisherId:
        validated.publisherId === undefined ? undefined : validated.publisherId || null,
    },
  });

  if (
    (validated.totalVolumes && validated.totalVolumes > (series.totalVolumes || 0)) ||
    needsStandaloneVolume(validated.totalVolumes, series.volumes.length)
  ) {
    const existingVolumeNumbers = new Set(
      series.volumes.map((v) => v.volumeNumber),
    );
    const newVolumes = [];

    for (let i = 1; i <= (validated.totalVolumes ?? 0); i++) {
      if (!existingVolumeNumbers.has(i)) {
        newVolumes.push({
          seriesId: id,
          volumeNumber: i,
          owned: false,
          read: false,
        });
      }
    }

    if (newVolumes.length > 0) {
      await prisma.volume.createMany({
        data: newVolumes,
        skipDuplicates: true,
      });
    }
  }

  return updated;
}

export async function deleteSeries(userId: string, id: string) {
  const series = await prisma.series.findFirst({
    where: { id, userId },
  });

  if (!series) {
    throw new NotFoundError("Series");
  }

  await prisma.series.delete({
    where: { id },
  });
}

export async function getSeries(userId: string, id: string) {
  return prisma.series.findFirst({
    where: { id, userId },
    include: {
      publisher: true,
      volumes: {
        orderBy: { volumeNumber: "asc" },
        include: { store: true },
      },
    },
  });
}

const seriesListSelect = {
  id: true,
  title: true,
  author: true,
  status: true,
  format: true,
  publishing: true,
  coverImage: true,
  totalVolumes: true,
  volumes: { select: { owned: true, read: true, pricePaid: true } },
} as const;

export async function getAllSeries(
  userId: string,
  { status, format, sort, search }: LibraryQuery = {},
) {
  let orderBy: { [key: string]: string } = { updatedAt: "desc" };
  if (sort === "title_asc") orderBy = { title: "asc" };
  else if (sort === "title_desc") orderBy = { title: "desc" };
  else if (sort === "created") orderBy = { createdAt: "desc" };

  const series = await prisma.series.findMany({
    where: {
      userId,
      ...(status && { status }),
      ...(format && { format }),
      ...(search && { title: { contains: search, mode: "insensitive" as const } }),
    },
    select: seriesListSelect,
    orderBy,
  });

  if (sort === "completion") {
    series.sort((a, b) => {
      const aTotal = a.totalVolumes || a.volumes.length;
      const bTotal = b.totalVolumes || b.volumes.length;
      const aProgress = aTotal > 0 ? a.volumes.filter((v) => v.owned).length / aTotal : 0;
      const bProgress = bTotal > 0 ? b.volumes.filter((v) => v.owned).length / bTotal : 0;
      return bProgress - aProgress;
    });
  } else if (sort === "spent") {
    series.sort((a, b) => {
      const aSpent = a.volumes.reduce((acc, v) => acc + (v.pricePaid || 0), 0);
      const bSpent = b.volumes.reduce((acc, v) => acc + (v.pricePaid || 0), 0);
      return bSpent - aSpent;
    });
  }

  return series;
}

export async function getLibraryFormats(userId: string): Promise<Format[]> {
  const rows = await prisma.series.findMany({
    where: { userId },
    select: { format: true },
    distinct: ["format"],
  });
  const order = Object.values(Format);
  return rows.map((r) => r.format).sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export async function getRecentSeries(userId: string, take = 5) {
  return prisma.series.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      coverImage: true,
      totalVolumes: true,
      volumes: { select: { owned: true } },
    },
  });
}

export async function getExistingMangadexIds(userId: string, mangadexIds: string[]): Promise<string[]> {
  if (mangadexIds.length === 0) return [];

  const existing = await prisma.series.findMany({
    where: {
      userId,
      mangadexId: { in: mangadexIds },
    },
    select: { mangadexId: true },
  });

  return existing.map((s) => s.mangadexId).filter((id): id is string => id !== null);
}

export async function getExistingOpenLibraryKeys(userId: string, keys: string[]): Promise<string[]> {
  if (keys.length === 0) return [];

  const existing = await prisma.series.findMany({
    where: { userId, openLibraryKey: { in: keys } },
    select: { openLibraryKey: true },
  });

  return existing.map((s) => s.openLibraryKey).filter((key): key is string => key !== null);
}

export async function getFormatCounts(userId: string): Promise<Partial<Record<Format, number>>> {
  const rows = await prisma.series.groupBy({
    by: ["format"],
    where: { userId },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [r.format, r._count._all]));
}

export async function getSeriesStats(userId: string) {
  const series = await prisma.series.findMany({
    where: { userId },
    select: {
      status: true,
      totalVolumes: true,
      retailPrice: true,
      volumes: { select: { owned: true, read: true, pricePaid: true } },
    },
  });

  const totalSeries = series.length;
  const totalVolumesOwned = series.reduce(
    (acc, s) => acc + s.volumes.filter((v) => v.owned).length,
    0,
  );
  const totalVolumesRead = series.reduce(
    (acc, s) => acc + s.volumes.filter((v) => v.read).length,
    0,
  );
  const totalSpent = series.reduce(
    (acc, s) =>
      acc + s.volumes.reduce((vacc, v) => vacc + (v.pricePaid || 0), 0),
    0,
  );

  let totalRetailValue = 0;
  let totalSavings = 0;
  for (const s of series) {
    const { retailValue, savings } = comparableSavings(s.volumes, s.retailPrice);
    totalRetailValue += retailValue;
    totalSavings += savings;
  }

  const totalExpectedVolumes = series.reduce(
    (acc, s) => acc + (s.totalVolumes || s.volumes.length),
    0,
  );

  const averagePrice =
    totalVolumesOwned > 0 ? totalSpent / totalVolumesOwned : 0;

  const byStatus = {
    reading: series.filter((s) => s.status === "READING").length,
    completed: series.filter((s) => s.status === "COMPLETED").length,
    onHold: series.filter((s) => s.status === "ON_HOLD").length,
    dropped: series.filter((s) => s.status === "DROPPED").length,
    planToRead: series.filter((s) => s.status === "PLAN_TO_READ").length,
  };

  return {
    totalSeries,
    totalVolumesOwned,
    totalVolumesRead,
    totalSpent,
    totalRetailValue,
    totalSavings,
    savingsPercentage:
      totalRetailValue > 0 ? (totalSavings / totalRetailValue) * 100 : 0,
    totalExpectedVolumes,
    averagePrice,
    byStatus,
    collectionProgress:
      totalExpectedVolumes > 0
        ? (totalVolumesOwned / totalExpectedVolumes) * 100
        : 0,
    readingProgress:
      totalVolumesOwned > 0 ? (totalVolumesRead / totalVolumesOwned) * 100 : 0,
  };
}
