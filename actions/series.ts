"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { SeriesStatus } from "@/lib/generated/prisma/enums";
import { Editorial } from "@/lib/generated/prisma/client";

export type CreateSeriesInput = {
  title: string;
  author?: string;
  editorial?: Editorial;
  status?: SeriesStatus;
  publishing?: boolean;
  totalVolumes?: number;
  coverImage?: string;
  description?: string;
  retailPrice?: number;
  malId?: number;
};

export type UpdateSeriesInput = Partial<CreateSeriesInput>;

export type VolumeInput = {
  volumeNumber: number;
  title?: string;
};

export async function createSeries(input: CreateSeriesInput) {
  const user = await requireUser();

  const series = await prisma.series.create({
    data: {
      ...input,
      userId: user.id,
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

  const series = await prisma.series.create({
    data: {
      ...input,
      userId: user.id,
      volumes: {
        create: volumes.map((v) => ({
          volumeNumber: v.volumeNumber,
          title: v.title,
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

  const series = await prisma.series.findFirst({
    where: { id, userId: user.id },
    include: { volumes: true },
  });

  if (!series) {
    throw new Error("Series not found");
  }

  const updated = await prisma.series.update({
    where: { id },
    data: input,
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
      volumes: {
        orderBy: { volumeNumber: "asc" },
      },
    },
  });

  return series;
}

export async function getAllSeries(status?: SeriesStatus) {
  const user = await requireUser();

  const series = await prisma.series.findMany({
    where: {
      userId: user.id,
      ...(status && { status }),
    },
    include: {
      volumes: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return series;
}

export async function getSeriesStats() {
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
}
