"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Condition, Store } from "@/lib/generated/prisma/enums";

export type CreateVolumeInput = {
  seriesId: string;
  volumeNumber: number;
  isbn?: string;
  coverImage?: string;
  owned?: boolean;
  read?: boolean;
  pricePaid?: number;
  condition?: Condition;
  store?: Store;
  purchaseDate?: Date;
  readDate?: Date;
  notes?: string;
};

export type UpdateVolumeInput = Partial<Omit<CreateVolumeInput, "seriesId">>;

export async function createVolume(input: CreateVolumeInput) {
  const user = await requireUser();

  // Verify the series belongs to the user
  const series = await prisma.series.findFirst({
    where: { id: input.seriesId, userId: user.id },
  });

  if (!series) {
    throw new Error("Series not found");
  }

  const volume = await prisma.volume.create({
    data: {
      seriesId: input.seriesId,
      volumeNumber: input.volumeNumber,
      isbn: input.isbn,
      coverImage: input.coverImage,
      owned: input.owned ?? false,
      read: input.read ?? false,
      pricePaid: input.pricePaid,
      condition: input.condition ?? "NEW",
      store: input.store,
      purchaseDate: input.owned ? (input.purchaseDate ?? new Date()) : null,
      readDate: input.read ? (input.readDate ?? new Date()) : null,
      notes: input.notes,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${input.seriesId}`);

  return volume;
}

export async function updateVolume(id: string, input: UpdateVolumeInput) {
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
    data: input,
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

  const updated = await prisma.volume.update({
    where: { id },
    data: {
      owned: !volume.owned,
      purchaseDate: !volume.owned ? new Date() : null,
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

// Mark a range of volumes as owned
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
      // If marking as not owned, also mark as not read
      ...(owned ? {} : { read: false, readDate: null }),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${seriesId}`);
}

// Mark a range of volumes as read
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

  // Only update volumes that are owned
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

// Mark all volumes up to a certain number as owned
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
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${seriesId}`);
}

// Mark all owned volumes as read
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
  const totalSpent = volumes.reduce((acc, v) => acc + (v.pricePaid || 0), 0);
  // Retail value is calculated from series retail price
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
