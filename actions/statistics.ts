"use server";

import { requireUser } from "@/lib/auth";
import { formatBreakdown } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { monthKey } from "@/utils/date";

/** Rounds money to cents. */
const cents = (amount: number) => Math.round(amount * 100) / 100;

/** Dated owned volumes, oldest first; `pricePaid` for the spending chart. */
async function datedOwnedVolumes(userId: string) {
  const volumes = await prisma.volume.findMany({
    where: { series: { userId }, owned: true, purchaseDate: { not: null } },
    select: { pricePaid: true, purchaseDate: true },
    orderBy: { purchaseDate: "asc" },
  });
  return volumes as { pricePaid: number | null; purchaseDate: Date }[];
}

/** Sum of `value` per purchase month, in month order. */
function byMonth<T extends { purchaseDate: Date }>(rows: T[], value: (row: T) => number) {
  const months = new Map<string, number>();
  for (const row of rows) {
    const key = monthKey(row.purchaseDate);
    months.set(key, (months.get(key) ?? 0) + value(row));
  }
  return [...months.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export async function getSpendingOverTime() {
  const user = await requireUser();
  const volumes = await datedOwnedVolumes(user.id);

  let cumulative = 0;
  return byMonth(volumes, (v) => v.pricePaid || 0).map(([month, amount]) => {
    cumulative += amount;
    return { month, amount: cents(amount), cumulative: cents(cumulative) };
  });
}

export async function getStatusDistribution() {
  const user = await requireUser();

  const series = await prisma.series.groupBy({
    by: ["status"],
    where: { userId: user.id },
    _count: { status: true },
  });

  return series.map((s) => ({
    status: s.status,
    count: s._count.status,
  }));
}

export async function getCollectionGrowth() {
  const user = await requireUser();
  const volumes = await datedOwnedVolumes(user.id);

  let total = 0;
  return byMonth(volumes, () => 1).map(([month, added]) => {
    total += added;
    return { month, added, total };
  });
}

export async function getPublisherBreakdown() {
  const user = await requireUser();

  const series = await prisma.series.findMany({
    where: { userId: user.id },
    select: {
      publisher: { select: { name: true } },
      volumes: { where: { owned: true }, select: { pricePaid: true } },
    },
  });

  return rankByName(
    series.map((s) => ({
      name: s.publisher?.name,
      count: s.volumes.length,
      spent: s.volumes.reduce((acc, v) => acc + (v.pricePaid || 0), 0),
    })),
  );
}

/**
 * Rows merged by name ("Unknown" when unnamed), most books first, spending
 * rounded to cents.
 */
function rankByName(rows: { name: string | undefined; count: number; spent: number }[]) {
  const byName = new Map<string, { count: number; spent: number }>();
  for (const row of rows) {
    const name = row.name || "Unknown";
    const entry = byName.get(name) ?? { count: 0, spent: 0 };
    byName.set(name, { count: entry.count + row.count, spent: cents(entry.spent + row.spent) });
  }
  return [...byName.entries()]
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count);
}

/** Owned books per format; every format in the library appears, even at 0. */
export async function getFormatBreakdown() {
  const user = await requireUser();

  const series = await prisma.series.findMany({
    where: { userId: user.id },
    select: {
      format: true,
      _count: { select: { volumes: { where: { owned: true } } } },
    },
  });

  return formatBreakdown(series.map((s) => ({ format: s.format, ownedCount: s._count.volumes })));
}

export async function getConditionDistribution() {
  const user = await requireUser();

  const conditions = await prisma.volume.groupBy({
    by: ["condition"],
    where: {
      series: { userId: user.id },
      owned: true,
      condition: { not: null },
    },
    _count: { condition: true },
  });

  return conditions.map((c) => ({
    condition: c.condition!,
    count: c._count.condition,
  }));
}

export async function getStoreBreakdown() {
  const user = await requireUser();

  // Aggregate in the database instead of loading every owned volume.
  const [groups, stores] = await Promise.all([
    prisma.volume.groupBy({
      by: ["storeId"],
      where: {
        series: { userId: user.id },
        owned: true,
      },
      _count: { _all: true },
      _sum: { pricePaid: true },
    }),
    prisma.userStore.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
    }),
  ]);

  const storeNames = new Map(stores.map((s) => [s.id, s.name]));
  return rankByName(
    groups.map((g) => ({
      name: g.storeId ? storeNames.get(g.storeId) : undefined,
      count: g._count._all,
      spent: g._sum.pricePaid || 0,
    })),
  );
}

/** Owned volumes the date-based charts can't place (no purchaseDate). */
export async function getUndatedOwnedCount() {
  const user = await requireUser();

  return prisma.volume.count({
    where: {
      series: { userId: user.id },
      owned: true,
      purchaseDate: null,
    },
  });
}
