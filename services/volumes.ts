import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { Condition } from "@/lib/generated/prisma/enums";
import type { VolumeSchema } from "@/lib/validations";

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
    },
  });
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

export async function toggleVolumeOwned(userId: string, id: string) {
  const volume = await prisma.volume.findFirst({
    where: { id },
    include: { series: true },
  });

  if (!volume || volume.series.userId !== userId) {
    throw new NotFoundError("Volume");
  }

  const nowOwned = !volume.owned;
  const updated = await prisma.volume.update({
    where: { id },
    data: {
      owned: nowOwned,
      purchaseDate: nowOwned ? new Date() : null,
      ...(nowOwned ? { wishlist: false } : {}),
    },
  });

  return { updated, seriesId: volume.seriesId };
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

export async function markVolumesOwned(
  userId: string,
  seriesId: string,
  volumeNumbers: number[],
  owned: boolean,
) {
  const series = await prisma.series.findFirst({
    where: { id: seriesId, userId },
  });

  if (!series) {
    throw new NotFoundError("Series");
  }

  await prisma.volume.updateMany({
    where: {
      seriesId,
      volumeNumber: { in: volumeNumbers },
    },
    data: {
      owned,
      purchaseDate: owned ? new Date() : null,
      ...(owned ? { wishlist: false } : { read: false, readDate: null }),
    },
  });
}

export async function markVolumesRead(
  userId: string,
  seriesId: string,
  volumeNumbers: number[],
  read: boolean,
) {
  const series = await prisma.series.findFirst({
    where: { id: seriesId, userId },
  });

  if (!series) {
    throw new NotFoundError("Series");
  }

  await prisma.volume.updateMany({
    where: {
      seriesId,
      volumeNumber: { in: volumeNumbers },
      owned: true,
    },
    data: {
      read,
      readDate: read ? new Date() : null,
    },
  });
}

export async function markVolumesOwnedUpTo(
  userId: string,
  seriesId: string,
  upToVolume: number,
) {
  const series = await prisma.series.findFirst({
    where: { id: seriesId, userId },
  });

  if (!series) {
    throw new NotFoundError("Series");
  }

  await prisma.volume.updateMany({
    where: {
      seriesId,
      volumeNumber: { lte: upToVolume },
    },
    data: {
      owned: true,
      purchaseDate: new Date(),
      wishlist: false,
    },
  });
}

export async function markAllOwnedAsRead(userId: string, seriesId: string) {
  const series = await prisma.series.findFirst({
    where: { id: seriesId, userId },
  });

  if (!series) {
    throw new NotFoundError("Series");
  }

  await prisma.volume.updateMany({
    where: {
      seriesId,
      owned: true,
    },
    data: {
      read: true,
      readDate: new Date(),
    },
  });
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
  const retailPricePerVolume = series.retailPrice || 0;
  const totalRetailValue = owned * retailPricePerVolume;
  const averagePrice = owned > 0 ? totalSpent / owned : 0;
  const total = series.totalVolumes || volumes.length;
  const missing = total - owned;
  const savings = totalRetailValue - totalSpent;

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

export async function bulkSetRead(userId: string, volumeIds: string[]) {
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
    where: { id: { in: volumeIds }, owned: true },
    data: {
      read: true,
      readDate: new Date(),
    },
  });

  return seriesIds;
}
