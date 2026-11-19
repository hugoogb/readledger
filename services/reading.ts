import { prisma } from "@/lib/prisma";
import { isStandalone } from "@/lib/format";
import type { ReadingVolume } from "@/lib/reading-stats";
import type { ReadingGoalSchema } from "@/lib/validations";

/** Every volume that can appear in reading stats, with only the fields they use. */
export async function getReadingVolumes(userId: string): Promise<ReadingVolume[]> {
  const volumes = await prisma.volume.findMany({
    where: {
      series: { userId },
      OR: [{ owned: true }, { read: true }],
    },
    select: {
      id: true,
      seriesId: true,
      volumeNumber: true,
      owned: true,
      read: true,
      purchaseDate: true,
      readDate: true,
      coverImage: true,
      series: {
        select: {
          title: true,
          coverImage: true,
          totalVolumes: true,
          _count: { select: { volumes: true } },
        },
      },
    },
  });

  return volumes.map(({ series: { totalVolumes, _count, ...series }, ...volume }) => ({
    ...volume,
    series: { ...series, standalone: isStandalone(totalVolumes, _count.volumes) },
  }));
}

export async function getReadingGoals(userId: string) {
  return prisma.readingGoal.findMany({
    where: { userId },
    select: { year: true, target: true },
    orderBy: { year: "desc" },
  });
}

export async function upsertReadingGoal(userId: string, { year, target }: ReadingGoalSchema) {
  return prisma.readingGoal.upsert({
    where: { userId_year: { userId, year } },
    create: { userId, year, target },
    update: { target },
  });
}

export async function deleteReadingGoal(userId: string, year: number) {
  // deleteMany scopes by user and is a no-op when no goal exists.
  await prisma.readingGoal.deleteMany({ where: { userId, year } });
}
