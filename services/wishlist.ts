import { prisma } from "@/lib/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors";

export async function toggleWishlist(userId: string, volumeId: string) {
  const volume = await prisma.volume.findFirst({
    where: { id: volumeId },
    include: { series: true },
  });

  if (!volume || volume.series.userId !== userId) {
    throw new NotFoundError("Volume");
  }

  // Can't wishlist an already-owned volume
  if (volume.owned && !volume.wishlist) {
    throw new ValidationError("Volume is already owned");
  }

  const updated = await prisma.volume.update({
    where: { id: volumeId },
    data: { wishlist: !volume.wishlist },
  });

  return { updated, seriesId: volume.seriesId };
}

export async function getWishlistVolumes(userId: string) {
  const volumes = await prisma.volume.findMany({
    where: {
      wishlist: true,
      owned: false,
      series: { userId },
    },
    select: {
      id: true,
      seriesId: true,
      volumeNumber: true,
      series: { select: { id: true, title: true, coverImage: true, retailPrice: true } },
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

/** Summary numbers derived from getWishlistVolumes() — no extra queries. */
export function wishlistStats(groups: Awaited<ReturnType<typeof getWishlistVolumes>>) {
  let count = 0;
  let estimatedCost = 0;
  for (const g of groups) {
    count += g.volumes.length;
    estimatedCost += g.volumes.length * (g.series.retailPrice || 0);
  }
  return { count, estimatedCost, seriesCount: groups.length };
}
