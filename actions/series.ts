"use server";

import { requireUser } from "@/lib/auth";
import { withResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { SeriesStatus } from "@/lib/generated/prisma/enums";
import { idSchema, seriesSchema, seriesVolumesSchema } from "@/lib/validations";
import { checkUserActionLimit } from "@/lib/rate-limit";
import * as seriesService from "@/services/series";

export type { CreateSeriesInput, UpdateSeriesInput, VolumeInput, SortOption } from "@/services/series";

export const createSeries = withResult(async (input: seriesService.CreateSeriesInput) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validated = seriesSchema.parse(input);

  const series = await seriesService.createSeries(user.id, validated);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");

  return series;
});

export const createSeriesWithVolumes = withResult(async (
  input: seriesService.CreateSeriesInput,
  volumes: seriesService.VolumeInput[],
) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validated = seriesSchema.parse(input);
  const validatedVolumes = seriesVolumesSchema.parse(volumes);

  const series = await seriesService.createSeriesWithVolumes(user.id, validated, validatedVolumes);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");

  return series;
});

export const updateSeries = withResult(async (id: string, input: seriesService.UpdateSeriesInput) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validated = seriesSchema.partial().parse(input);

  const updated = await seriesService.updateSeries(user.id, id, validated);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${id}`);

  return updated;
});

export const deleteSeries = withResult(async (id: string) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);

  await seriesService.deleteSeries(user.id, id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
});

export const getSeries = cache(async function getSeries(id: string) {
  const user = await requireUser();
  // A malformed id in the URL is simply "not found", not a database error.
  if (!idSchema.safeParse(id).success) return null;
  return seriesService.getSeries(user.id, id);
});

export async function getAllSeries(
  status?: SeriesStatus,
  sort?: seriesService.SortOption,
  search?: string,
) {
  const user = await requireUser();
  return seriesService.getAllSeries(user.id, status, sort, search?.slice(0, 200));
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

export async function getRecentSeries() {
  const user = await requireUser();
  return seriesService.getRecentSeries(user.id);
}
