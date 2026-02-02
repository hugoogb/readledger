"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { SeriesStatus } from "@/lib/generated/prisma/enums";
import { seriesSchema } from "@/lib/validations";
import { checkUserActionLimit } from "@/lib/rate-limit";

export type CreateSeriesInput = {
  title: string;
  author?: string;
  publisherId?: string;
  status?: SeriesStatus;
  publishing?: boolean;
  totalVolumes?: number;
  coverImage?: string;
  description?: string;
  retailPrice?: number;
  mangadexId?: string;
};

export type UpdateSeriesInput = Partial<CreateSeriesInput>;

export type VolumeInput = {
  volumeNumber: number;
  title?: string;
  coverImage?: string | null;
};

export async function createSeries(input: CreateSeriesInput) {
  const user = await requireUser();
  checkUserActionLimit(user.id);

  const validated = seriesSchema.parse(input);

  const series = await prisma.series.create({
    data: {
      ...validated,
      userId: user.id,
      publisherId: validated.publisherId || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");

  return series;
}

// Create series with pre-generated volume entries
export async function createSeriesWithVolumes(
  input: CreateSeriesInput,
  volumes: VolumeInput[],
) {
  const user = await requireUser();
  checkUserActionLimit(user.id);

  const validated = seriesSchema.parse(input);

  const series = await prisma.series.create({
    data: {
      ...validated,
      userId: user.id,
      publisherId: validated.publisherId || null,
      volumes: {
        create: volumes.map((v) => ({
          volumeNumber: v.volumeNumber,
          title: v.title,
          coverImage: v.coverImage || null,
          owned: false,
          read: false,
        })),
      },
    },
    include: {
      volumes: true,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");

  return series;
}

export async function updateSeries(id: string, input: UpdateSeriesInput) {
  const user = await requireUser();
  checkUserActionLimit(user.id);

  const series = await prisma.series.findFirst({
    where: { id, userId: user.id },
    include: { volumes: true },
  });

  if (!series) {
    throw new Error("Series not found");
  }

  const validated = seriesSchema.partial().parse(input);

  const updated = await prisma.series.update({
    where: { id },
    data: {
      ...validated,
      publisherId: validated.publisherId || undefined,
    },
  });

  // If totalVolumes increased, create new volume entries
  if (input.totalVolumes && input.totalVolumes > (series.totalVolumes || 0)) {
    const existingVolumeNumbers = new Set(
      series.volumes.map((v) => v.volumeNumber),
    );
    const newVolumes = [];

    for (let i = 1; i <= input.totalVolumes; i++) {
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

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${id}`);

  return updated;
}

export async function deleteSeries(id: string) {
  const user = await requireUser();
  checkUserActionLimit(user.id);

  const series = await prisma.series.findFirst({
    where: { id, userId: user.id },
  });

  if (!series) {
    throw new Error("Series not found");
  }

  await prisma.series.delete({
    where: { id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
}

export async function getSeries(id: string) {
  const user = await requireUser();

  const series = await prisma.series.findFirst({
    where: { id, userId: user.id },
    include: {
      publisher: true,
      volumes: {
        orderBy: { volumeNumber: "asc" },
        include: { store: true },
      },
    },
  });

  return series;
}

export type SortOption = "updated" | "title_asc" | "title_desc" | "created" | "completion" | "spent";

export async function getAllSeries(status?: SeriesStatus, sort?: SortOption) {
  const user = await requireUser();

  let orderBy: { [key: string]: string } = { updatedAt: "desc" };
  if (sort === "title_asc") orderBy = { title: "asc" };
  else if (sort === "title_desc") orderBy = { title: "desc" };
  else if (sort === "created") orderBy = { createdAt: "desc" };

  const series = await prisma.series.findMany({
    where: {
      userId: user.id,
      ...(status && { status }),
    },
    include: {
      publisher: true,
      volumes: true,
    },
    orderBy,
  });

  // Client-side sort for computed fields
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

export async function checkDuplicateSeries(mangadexId: string): Promise<boolean> {
  const user = await requireUser();

  const existing = await prisma.series.findFirst({
    where: { userId: user.id, mangadexId },
  });

  return !!existing;
}

export async function getExistingMangadexIds(mangadexIds: string[]): Promise<string[]> {
  const user = await requireUser();

  if (mangadexIds.length === 0) return [];

  const existing = await prisma.series.findMany({
    where: {
      userId: user.id,
      mangadexId: { in: mangadexIds },
    },
    select: { mangadexId: true },
  });

  return existing.map((s) => s.mangadexId).filter((id): id is string => id !== null);
}

export const getSeriesStats = cache(async function getSeriesStats() {
  const user = await requireUser();

  const series = await prisma.series.findMany({
    where: { userId: user.id },
    include: { volumes: true },
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

  // Calculate retail value from series retail price
  const totalRetailValue = series.reduce((acc, s) => {
    const ownedCount = s.volumes.filter((v) => v.owned).length;
    return acc + ownedCount * (s.retailPrice || 0);
  }, 0);

  const totalExpectedVolumes = series.reduce(
    (acc, s) => acc + (s.totalVolumes || s.volumes.length),
    0,
  );

  const averagePrice =
    totalVolumesOwned > 0 ? totalSpent / totalVolumesOwned : 0;

  const totalSavings = totalRetailValue - totalSpent;

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
});

export async function getDashboardData() {
  const [stats, recentSeries] = await Promise.all([
    getSeriesStats(),
    getAllSeries(),
  ]);

  return {
    stats,
    recentSeries: recentSeries.slice(0, 5),
  };
}
