import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { Condition } from "@/lib/generated/prisma/enums";
import type { VolumeSchema } from "@/lib/validations";
import { comparableSavings } from "@/lib/savings";

export const MAX_BULK_SIZE = 500;

export type CreateVolumeInput = VolumeSchema & { seriesId: string };
export type UpdateVolumeInput = Partial<VolumeSchema>;

export async function createVolume(userId: string, validated: CreateVolumeInput) {
  const series = await prisma.series.findFirst({
    where: { id: validated.seriesId, userId },
  });

  if (!series) {
    throw new NotFoundError("Series");
  }

  return prisma.volume.create({
    data: {
      ...validated,
      seriesId: validated.seriesId,
      volumeNumber: validated.volumeNumber,
      purchaseDate: validated.owned
        ? (validated.purchaseDate ?? new Date())
        : null,
      readDate: validated.read ? (validated.readDate ?? new Date()) : null,
      storeId: validated.storeId || null,
      condition: (validated.condition as Condition) || null,
    },
  });
}

export async function updateVolume(userId: string, id: string, validated: UpdateVolumeInput) {
  const volume = await prisma.volume.findFirst({
    where: { id },
    include: { series: true },
  });

  if (!volume || volume.series.userId !== userId) {
    throw new NotFoundError("Volume");
  }

  return prisma.volume.update({
    where: { id },
    data: {
      ...validated,
      storeId: validated.storeId !== undefined ? (validated.storeId || null) : undefined,
      condition: validated.condition ? (validated.condition as Condition) : validated.condition === null ? null : undefined,
      readDate: resolveReadDate(validated, volume.readDate),
    },
  });
}

// Keep readDate consistent with the read flag: unread volumes have no date,
// and a read volume always has one (an explicit date wins, then the stored
// one, then today). `undefined` leaves the column untouched.
function resolveReadDate(
  input: Pick<UpdateVolumeInput, "read" | "readDate">,
  current: Date | null,
): Date | null | undefined {
  if (input.read === false) return null;
  const isRead = input.read === true;
  if (input.readDate) return input.readDate;
  if (isRead) return current ?? new Date();
  return undefined;
}

export async function deleteVolume(userId: string, id: string) {
  const volume = await prisma.volume.findFirst({
    where: { id },
    include: { series: true },
  });

  if (!volume || volume.series.userId !== userId) {
    throw new NotFoundError("Volume");
  }

  await prisma.volume.delete({
    where: { id },
  });

  return volume.seriesId;
}

export async function toggleVolumeRead(userId: string, id: string) {
  const volume = await prisma.volume.findFirst({
    where: { id },
    include: { series: true },
  });

  if (!volume || volume.series.userId !== userId) {
    throw new NotFoundError("Volume");
  }

  const updated = await prisma.volume.update({
    where: { id },
    data: {
      read: !volume.read,
      readDate: !volume.read ? new Date() : null,
    },
  });

  return { updated, seriesId: volume.seriesId };
}

export async function getVolumeStats(userId: string, seriesId: string) {
  const series = await prisma.series.findFirst({
    where: { id: seriesId, userId },
    include: { volumes: true },
  });

  if (!series) {
    throw new NotFoundError("Series");
  }

  const volumes = series.volumes;
  const owned = volumes.filter((v) => v.owned).length;
  const read = volumes.filter((v) => v.read).length;
  const wishlisted = volumes.filter((v) => v.wishlist).length;
  const totalSpent = volumes.reduce((acc, v) => acc + (v.pricePaid || 0), 0);
  const { retailValue: totalRetailValue, savings } = comparableSavings(
    volumes,
    series.retailPrice,
  );
  const averagePrice = owned > 0 ? totalSpent / owned : 0;
  const total = series.totalVolumes || volumes.length;
  const missing = total - owned;

  return {
    owned,
    read,
    missing,
    total,
    wishlisted,
    totalSpent,
    totalRetailValue,
    averagePrice,
    savings,
    savingsPercentage:
      totalRetailValue > 0 ? (savings / totalRetailValue) * 100 : 0,
    ownedProgress: total > 0 ? (owned / total) * 100 : 0,
    readProgress: owned > 0 ? (read / owned) * 100 : 0,
  };
}

export async function bulkMarkOwned(
  userId: string,
  volumeIds: string[],
  data: {
    pricePaid?: number;
    storeId?: string;
    condition: Condition;
    purchaseDate?: Date;
    notes?: string;
  },
) {
  if (volumeIds.length === 0) throw new Error("No volumes selected");
  if (volumeIds.length > MAX_BULK_SIZE) throw new Error(`Cannot process more than ${MAX_BULK_SIZE} volumes at once`);

  const volumes = await prisma.volume.findMany({
    where: { id: { in: volumeIds } },
    include: { series: true },
  });

  if (volumes.length !== volumeIds.length) {
    throw new NotFoundError("Some volumes");
  }

  const seriesIds = new Set<string>();
  for (const volume of volumes) {
    if (volume.series.userId !== userId) {
      throw new Error("Unauthorized");
    }
    seriesIds.add(volume.seriesId);
  }

  await prisma.volume.updateMany({
    where: { id: { in: volumeIds } },
    data: {
      owned: true,
      wishlist: false,
      pricePaid: data.pricePaid ?? null,
      storeId: data.storeId || null,
      condition: data.condition,
      purchaseDate: data.purchaseDate ?? new Date(),
      notes: data.notes ?? null,
    },
  });

  return seriesIds;
}

export async function bulkSetRead(
  userId: string,
  volumeIds: string[],
  readDate?: Date,
) {
  if (volumeIds.length === 0) throw new Error("No volumes selected");
  if (volumeIds.length > MAX_BULK_SIZE) throw new Error(`Cannot process more than ${MAX_BULK_SIZE} volumes at once`);

  const volumes = await prisma.volume.findMany({
    where: { id: { in: volumeIds } },
    include: { series: true },
  });

  if (volumes.length !== volumeIds.length) {
    throw new NotFoundError("Some volumes");
  }

  const seriesIds = new Set<string>();
  for (const volume of volumes) {
    if (volume.series.userId !== userId) {
      throw new Error("Unauthorized");
    }
    seriesIds.add(volume.seriesId);
  }

  await prisma.volume.updateMany({
    where: { id: { in: volumeIds }, owned: true, read: false },
    data: {
      read: true,
      readDate: readDate ?? new Date(),
    },
  });

  return seriesIds;
}
