"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleWishlist(volumeId: string) {
  const user = await requireUser();

  const volume = await prisma.volume.findFirst({
    where: { id: volumeId },
    include: { series: true },
  });

  if (!volume || volume.series.userId !== user.id) {
    throw new Error("Volume not found");
  }

  // Can't wishlist an already-owned volume
  if (volume.owned && !volume.wishlist) {
    throw new Error("Volume is already owned");
  }

  const updated = await prisma.volume.update({
    where: { id: volumeId },
    data: { wishlist: !volume.wishlist },
  });

  revalidatePath(`/dashboard/series/${volume.seriesId}`);
  revalidatePath("/dashboard/wishlist");

  return updated;
}

export async function getWishlistVolumes() {
  const user = await requireUser();

  const volumes = await prisma.volume.findMany({
    where: {
      wishlist: true,
      owned: false,
      series: { userId: user.id },
    },
    include: {
      series: true,
    },
    orderBy: [
      { series: { title: "asc" } },
      { volumeNumber: "asc" },
    ],
  });

  // Group by series
  const grouped = new Map<
    string,
    {
      series: { id: string; title: string; coverImage: string | null; retailPrice: number | null };
      volumes: typeof volumes;
    }
  >();

  for (const vol of volumes) {
    if (!grouped.has(vol.seriesId)) {
      grouped.set(vol.seriesId, {
        series: {
          id: vol.series.id,
          title: vol.series.title,
          coverImage: vol.series.coverImage,
          retailPrice: vol.series.retailPrice,
        },
        volumes: [],
      });
    }
    grouped.get(vol.seriesId)!.volumes.push(vol);
  }

  return Array.from(grouped.values());
}

export async function getWishlistStats() {
  const user = await requireUser();

  const count = await prisma.volume.count({
    where: {
      wishlist: true,
      owned: false,
      series: { userId: user.id },
    },
  });

  const volumes = await prisma.volume.findMany({
    where: {
      wishlist: true,
      owned: false,
      series: { userId: user.id },
    },
    include: { series: true },
  });

  const estimatedCost = volumes.reduce(
    (acc, v) => acc + (v.series.retailPrice || 0),
    0,
  );

  const seriesCount = new Set(volumes.map((v) => v.seriesId)).size;

  return { count, estimatedCost, seriesCount };
}
