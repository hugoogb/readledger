"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getSpendingOverTime() {
  const user = await requireUser();

  const volumes = await prisma.volume.findMany({
    where: {
      series: { userId: user.id },
      owned: true,
      purchaseDate: { not: null },
    },
    select: {
      pricePaid: true,
      purchaseDate: true,
    },
    orderBy: { purchaseDate: "asc" },
  });

  const monthlyMap = new Map<string, number>();
  for (const vol of volumes) {
    if (!vol.purchaseDate) continue;
    const key = `${vol.purchaseDate.getFullYear()}-${String(vol.purchaseDate.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + (vol.pricePaid || 0));
  }

  const entries = Array.from(monthlyMap.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  let cumulative = 0;
  return entries.map(([month, amount]) => {
    cumulative += amount;
    return { month, amount: Math.round(amount * 100) / 100, cumulative: Math.round(cumulative * 100) / 100 };
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

  const volumes = await prisma.volume.findMany({
    where: {
      series: { userId: user.id },
      owned: true,
      purchaseDate: { not: null },
    },
    select: { purchaseDate: true },
    orderBy: { purchaseDate: "asc" },
  });

  const monthlyMap = new Map<string, number>();
  for (const vol of volumes) {
    if (!vol.purchaseDate) continue;
    const key = `${vol.purchaseDate.getFullYear()}-${String(vol.purchaseDate.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
  }

  const entries = Array.from(monthlyMap.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  let cumulative = 0;
  return entries.map(([month, count]) => {
    cumulative += count;
    return { month, added: count, total: cumulative };
  });
}

export async function getPublisherBreakdown() {
  const user = await requireUser();

  const series = await prisma.series.findMany({
    where: { userId: user.id },
    include: {
      publisher: true,
      volumes: { where: { owned: true } },
    },
  });

  const publisherMap = new Map<string, { volumes: number; spent: number }>();

  for (const s of series) {
    const name = s.publisher?.name || "Unknown";
    const existing = publisherMap.get(name) || { volumes: 0, spent: 0 };
    const ownedCount = s.volumes.length;
    const spent = s.volumes.reduce((acc, v) => acc + (v.pricePaid || 0), 0);
    publisherMap.set(name, {
      volumes: existing.volumes + ownedCount,
      spent: Math.round((existing.spent + spent) * 100) / 100,
    });
  }

  return Array.from(publisherMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.volumes - a.volumes);
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

  const volumes = await prisma.volume.findMany({
    where: {
      series: { userId: user.id },
      owned: true,
    },
    include: { store: true },
  });

  const storeMap = new Map<string, { count: number; spent: number }>();

  for (const vol of volumes) {
    const name = vol.store?.name || "Unknown";
    const existing = storeMap.get(name) || { count: 0, spent: 0 };
    storeMap.set(name, {
      count: existing.count + 1,
      spent: Math.round((existing.spent + (vol.pricePaid || 0)) * 100) / 100,
    });
  }

  return Array.from(storeMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count);
}
