import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { Condition, SeriesStatus } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";
import { isStandalone, standaloneStatusAfterRead } from "@/lib/format";
import type { VolumeSchema } from "@/lib/validations";
import { comparableSavings } from "@/lib/savings";
import { parseDateInput, startOfUtcDay } from "@/utils/date";
import { blankToNull } from "@/lib/normalize";
import { assertOwnedStore } from "@/services/ownership";

export type CreateVolumeInput = VolumeSchema & { seriesId: string };
export type UpdateVolumeInput = Partial<VolumeSchema>;

const CLEARABLE_FIELDS = ["title", "coverImage", "notes"] as const;

// What a volume lookup needs from its title: ownership plus the inputs of the
// standalone status sync.
const seriesForSync = {
  select: {
    userId: true,
    status: true,
    totalVolumes: true,
    _count: { select: { volumes: true } },
  },
} as const;

type SyncSeries = { status: SeriesStatus; totalVolumes: number | null; _count: { volumes: number } };

/**
 * Standalone books keep their status in step with being read: reading one
 * completes it, un-reading a completed one reopens it. Series are untouched.
 * Runs inside the caller's transaction so every read change gets it.
 */
async function syncStandaloneStatus(
  tx: Prisma.TransactionClient,
  seriesId: string,
  series: SyncSeries,
  read: boolean,
) {
  if (!isStandalone(series.totalVolumes, series._count.volumes)) return;
  const status = standaloneStatusAfterRead(series.status, read);
  if (status) await tx.series.update({ where: { id: seriesId }, data: { status } });
}

export async function createVolume(userId: string, validated: CreateVolumeInput) {
  const series = await prisma.series.findFirst({
    where: { id: validated.seriesId, userId },
  });

  if (!series) {
    throw new NotFoundError("Series");
  }

  await assertOwnedStore(userId, validated.storeId);

  return prisma.volume.create({
    data: {
      ...blankToNull(validated, CLEARABLE_FIELDS),
      seriesId: validated.seriesId,
      volumeNumber: validated.volumeNumber,
      purchaseDate: validated.owned
        ? (validated.purchaseDate ?? startOfUtcDay())
        : null,
      readDate: validated.read ? (validated.readDate ?? startOfUtcDay()) : null,
      storeId: validated.storeId || null,
      condition: validated.condition ?? null,
    },
  });
}

export async function updateVolume(userId: string, id: string, validated: UpdateVolumeInput) {
  const volume = await prisma.volume.findFirst({
    where: { id },
    include: { series: seriesForSync },
  });

  if (!volume || volume.series.userId !== userId) {
    throw new NotFoundError("Volume");
  }

  await assertOwnedStore(userId, validated.storeId);

  const readChanged = validated.read !== undefined && validated.read !== volume.read;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.volume.update({
      where: { id },
      data: {
        ...blankToNull(validated, CLEARABLE_FIELDS),
        // Owning a volume takes it off the wishlist (as bulkMarkOwned does), so
        // removing it from the collection later doesn't resurrect the wish.
        ...(validated.owned === true && { wishlist: false }),
        storeId: validated.storeId !== undefined ? (validated.storeId || null) : undefined,
        readDate: resolveReadDate(validated, volume.readDate),
      },
    });
    if (readChanged) {
      await syncStandaloneStatus(tx, volume.seriesId, volume.series, validated.read!);
    }
    return updated;
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
  if (isRead) return current ?? startOfUtcDay();
  return undefined;
}

export async function deleteVolume(userId: string, id: string) {
  const volume = await prisma.volume.findFirst({
    where: { id },
    select: { seriesId: true, series: { select: { userId: true } } },
  });

  if (!volume || volume.series.userId !== userId) {
    throw new NotFoundError("Volume");
  }

  await prisma.volume.delete({
    where: { id },
  });

  return volume.seriesId;
}

// `today` is the client's local calendar date ("YYYY-MM-DD"); the server runs
// in UTC and would otherwise date late-night reads to the previous day.
export async function toggleVolumeRead(userId: string, id: string, today?: string) {
  const volume = await prisma.volume.findFirst({
    where: { id },
    include: { series: seriesForSync },
  });

  if (!volume || volume.series.userId !== userId) {
    throw new NotFoundError("Volume");
  }

  const read = !volume.read;
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.volume.update({
      where: { id },
      data: {
        read,
        readDate: read ? (parseDateInput(today) ?? startOfUtcDay()) : null,
      },
    });
    await syncStandaloneStatus(tx, volume.seriesId, volume.series, read);
    return result;
  });

  return { updated, seriesId: volume.seriesId };
}

type StatsVolume = { owned: boolean; read: boolean; wishlist: boolean; pricePaid: number | null };

export function computeVolumeStats(series: {
  totalVolumes: number | null;
  retailPrice: number | null;
  volumes: StatsVolume[];
}) {
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

/**
 * The volumes behind `volumeIds` with their series' sync fields, and the
 * series they belong to. Throws unless every id is one of the user's volumes.
 */
async function findOwnedVolumes(userId: string, volumeIds: string[]) {
  const volumes = await prisma.volume.findMany({
    where: { id: { in: volumeIds } },
    include: { series: seriesForSync },
  });

  if (volumes.length !== volumeIds.length || volumes.some((v) => v.series.userId !== userId)) {
    throw new NotFoundError("Some volumes");
  }

  return { volumes, seriesIds: new Set(volumes.map((v) => v.seriesId)) };
}

/** `volumeIds` is validated by the action (volumeIdsSchema: 1 to MAX_BULK_SIZE ids). */
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
  const { seriesIds } = await findOwnedVolumes(userId, volumeIds);
  await assertOwnedStore(userId, data.storeId);

  await prisma.volume.updateMany({
    where: { id: { in: volumeIds } },
    data: {
      owned: true,
      wishlist: false,
      pricePaid: data.pricePaid ?? null,
      storeId: data.storeId || null,
      condition: data.condition,
      purchaseDate: data.purchaseDate ?? startOfUtcDay(),
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
  const { volumes, seriesIds } = await findOwnedVolumes(userId, volumeIds);

  await prisma.$transaction(async (tx) => {
    await tx.volume.updateMany({
      where: { id: { in: volumeIds }, owned: true, read: false },
      data: {
        read: true,
        readDate: readDate ?? startOfUtcDay(),
      },
    });
    // Only the volumes this update actually marks read change their title.
    for (const volume of volumes) {
      if (volume.owned && !volume.read) {
        await syncStandaloneStatus(tx, volume.seriesId, volume.series, true);
      }
    }
  });

  return seriesIds;
}
