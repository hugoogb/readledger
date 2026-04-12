"use server";

import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { SeriesStatus } from "@/lib/generated/prisma/enums";
import { seriesSchema } from "@/lib/validations";
import { checkUserActionLimit } from "@/lib/rate-limit";
import * as seriesService from "@/services/series";

export type { CreateSeriesInput, UpdateSeriesInput, VolumeInput, SortOption } from "@/services/series";

export async function createSeries(input: seriesService.CreateSeriesInput) {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validated = seriesSchema.parse(input);

  const series = await seriesService.createSeries(user.id, validated);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");

  return series;
}

export async function createSeriesWithVolumes(
  input: seriesService.CreateSeriesInput,
  volumes: seriesService.VolumeInput[],
) {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validated = seriesSchema.parse(input);

  const series = await seriesService.createSeriesWithVolumes(user.id, validated, volumes);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");

  return series;
}

export async function updateSeries(id: string, input: seriesService.UpdateSeriesInput) {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validated = seriesSchema.partial().parse(input);

  const updated = await seriesService.updateSeries(user.id, id, validated);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${id}`);

  return updated;
}

export async function deleteSeries(id: string) {
  const user = await requireUser();
  checkUserActionLimit(user.id);

  await seriesService.deleteSeries(user.id, id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
}

export const getSeries = cache(async function getSeries(id: string) {
  const user = await requireUser();
  return seriesService.getSeries(user.id, id);
});

export async function getAllSeries(status?: SeriesStatus, sort?: seriesService.SortOption) {
  const user = await requireUser();
  return seriesService.getAllSeries(user.id, status, sort);
}

export async function checkDuplicateSeries(mangadexId: string): Promise<boolean> {
  const user = await requireUser();
  return seriesService.checkDuplicateSeries(user.id, mangadexId);
}

export async function getExistingMangadexIds(mangadexIds: string[]): Promise<string[]> {
  const user = await requireUser();
  return seriesService.getExistingMangadexIds(user.id, mangadexIds);
}

export const getSeriesStats = cache(async function getSeriesStats() {
  const user = await requireUser();
  return seriesService.getSeriesStats(user.id);
});

export async function getDashboardData() {
  const [stats, recentSeries] = await Promise.all([
    getSeriesStats(),
    getAllSeries(),
  ]);

  return {
    stats,
    recentSeries: recentSeries.slice(0, 5),
  };
}
