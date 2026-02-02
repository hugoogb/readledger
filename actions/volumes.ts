"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Condition } from "@/lib/generated/prisma/enums";
import { volumeSchema } from "@/lib/validations";
import { checkUserActionLimit } from "@/lib/rate-limit";

export type CreateVolumeInput = {
  seriesId: string;
  volumeNumber: number;
  isbn?: string;
  coverImage?: string;
  owned?: boolean;
  read?: boolean;
  wishlist?: boolean;
  pricePaid?: number;
  condition?: Condition;
  storeId?: string;
  purchaseDate?: Date;
  readDate?: Date;
  notes?: string;
};

export type UpdateVolumeInput = Partial<{
  [K in keyof Omit<CreateVolumeInput, "seriesId">]: Omit<CreateVolumeInput, "seriesId">[K] | null;
}>;

export async function createVolume(input: CreateVolumeInput) {
  const user = await requireUser();

  const series = await prisma.series.findFirst({
    where: { id: input.seriesId, userId: user.id },
  });

  if (!series) {
    throw new Error("Series not found");
  }

  const validated = volumeSchema.parse(input);

  const volume = await prisma.volume.create({
    data: {
      ...validated,
      seriesId: input.seriesId,
      volumeNumber: input.volumeNumber,
      purchaseDate: validated.owned
        ? (validated.purchaseDate ?? new Date())
        : null,
      readDate: validated.read ? (validated.readDate ?? new Date()) : null,
      storeId: validated.storeId || null,
      condition: (validated.condition as Condition) || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${input.seriesId}`);

  return volume;
}

export async function updateVolume(id: string, input: UpdateVolumeInput) {
  const user = await requireUser();
  checkUserActionLimit(user.id);

  const volume = await prisma.volume.findFirst({
    where: { id },
    include: { series: true },
  });

  if (!volume || volume.series.userId !== user.id) {
    throw new Error("Volume not found");
  }

  const validated = volumeSchema.partial().parse(input);

  const updated = await prisma.volume.update({
    where: { id },
    data: {
      ...validated,
      storeId: validated.storeId !== undefined ? (validated.storeId || null) : undefined,
      condition: validated.condition ? (validated.condition as Condition) : validated.condition === null ? null : undefined,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${volume.seriesId}`);

  return updated;
}

export async function deleteVolume(id: string) {
  const user = await requireUser();

  const volume = await prisma.volume.findFirst({
    where: { id },
    include: { series: true },
  });

  if (!volume || volume.series.userId !== user.id) {
    throw new Error("Volume not found");
  }

  await prisma.volume.delete({
    where: { id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${volume.seriesId}`);
}

export async function toggleVolumeOwned(id: string) {
  const user = await requireUser();

  const volume = await prisma.volume.findFirst({
    where: { id },
    include: { series: true },
  });

  if (!volume || volume.series.userId !== user.id) {
    throw new Error("Volume not found");
  }

  const nowOwned = !volume.owned;
  const updated = await prisma.volume.update({
    where: { id },
    data: {
      owned: nowOwned,
      purchaseDate: nowOwned ? new Date() : null,
      // Auto-clear wishlist when marking as owned
      ...(nowOwned ? { wishlist: false } : {}),
    },
  });

  revalidatePath(`/dashboard/series/${volume.seriesId}`);

  return updated;
}

export async function toggleVolumeRead(id: string) {
  const user = await requireUser();

  const volume = await prisma.volume.findFirst({
    where: { id },
    include: { series: true },
  });

  if (!volume || volume.series.userId !== user.id) {
    throw new Error("Volume not found");
  }

  const updated = await prisma.volume.update({
    where: { id },
    data: {
      read: !volume.read,
      readDate: !volume.read ? new Date() : null,
    },
  });

  revalidatePath(`/dashboard/series/${volume.seriesId}`);

  return updated;
}

export async function markVolumesOwned(
  seriesId: string,
  volumeNumbers: number[],
  owned: boolean,
) {
  const user = await requireUser();

  const series = await prisma.series.findFirst({
    where: { id: seriesId, userId: user.id },
  });

  if (!series) {
    throw new Error("Series not found");
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

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${seriesId}`);
}

export async function markVolumesRead(
  seriesId: string,
  volumeNumbers: number[],
  read: boolean,
) {
  const user = await requireUser();

  const series = await prisma.series.findFirst({
    where: { id: seriesId, userId: user.id },
  });

  if (!series) {
    throw new Error("Series not found");
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

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${seriesId}`);
}

export async function markVolumesOwnedUpTo(
  seriesId: string,
  upToVolume: number,
) {
  const user = await requireUser();

  const series = await prisma.series.findFirst({
    where: { id: seriesId, userId: user.id },
  });

  if (!series) {
    throw new Error("Series not found");
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

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${seriesId}`);
}

export async function markAllOwnedAsRead(seriesId: string) {
  const user = await requireUser();

  const series = await prisma.series.findFirst({
    where: { id: seriesId, userId: user.id },
  });

  if (!series) {
    throw new Error("Series not found");
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

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${seriesId}`);
}

export async function getVolumeStats(seriesId: string) {
  const user = await requireUser();

  const series = await prisma.series.findFirst({
    where: { id: seriesId, userId: user.id },
    include: { volumes: true },
  });

  if (!series) {
    throw new Error("Series not found");
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
  volumeIds: string[],
  data: {
    pricePaid?: number;
    storeId?: string;
    condition: Condition;
    purchaseDate?: Date;
    notes?: string;
  },
) {
  const user = await requireUser();
  checkUserActionLimit(user.id);

  const volumes = await prisma.volume.findMany({
    where: { id: { in: volumeIds } },
    include: { series: true },
  });

  if (volumes.length !== volumeIds.length) {
    throw new Error("Some volumes not found");
  }

  const seriesIds = new Set<string>();
  for (const volume of volumes) {
    if (volume.series.userId !== user.id) {
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

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  for (const seriesId of seriesIds) {
    revalidatePath(`/dashboard/series/${seriesId}`);
  }
}

export async function bulkSetRead(volumeIds: string[]) {
  const user = await requireUser();

  const volumes = await prisma.volume.findMany({
    where: { id: { in: volumeIds } },
    include: { series: true },
  });

  if (volumes.length !== volumeIds.length) {
    throw new Error("Some volumes not found");
  }

  const seriesIds = new Set<string>();
  for (const volume of volumes) {
    if (volume.series.userId !== user.id) {
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

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  for (const seriesId of seriesIds) {
    revalidatePath(`/dashboard/series/${seriesId}`);
  }
}
