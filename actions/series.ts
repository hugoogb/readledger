"use server";

import { requireUser } from "@/lib/auth";
import { withResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { idSchema, openLibraryKeySchema, seriesSchema, seriesVolumesSchema } from "@/lib/validations";
import { checkUserActionLimit } from "@/lib/rate-limit";
import { parseIsbnQuery, toStoredIsbn } from "@/lib/isbn";
import * as seriesService from "@/services/series";
import { findVolumeByIsbn } from "@/services/isbn-volume";

export type { CreateSeriesInput, UpdateSeriesInput, VolumeInput, SortOption, LibraryQuery } from "@/services/series";

export const createSeries = withResult(async (input: seriesService.CreateSeriesInput) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validated = seriesSchema.parse(input);

  const series = await seriesService.createSeries(user.id, validated);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/library");

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
  revalidatePath("/dashboard/library");

  return series;
});

export const updateSeries = withResult(async (id: string, input: seriesService.UpdateSeriesInput) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validated = seriesSchema.partial().parse(input);

  const updated = await seriesService.updateSeries(user.id, id, validated);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/library");
  revalidatePath(`/dashboard/library/${id}`);

  return updated;
});

export const deleteSeries = withResult(async (id: string) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);

  await seriesService.deleteSeries(user.id, id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/library");
});

export const getSeries = cache(async function getSeries(id: string) {
  const user = await requireUser();
  // A malformed id in the URL is simply "not found", not a database error.
  if (!idSchema.safeParse(id).success) return null;
  return seriesService.getSeries(user.id, id);
});

export async function getAllSeries(query: seriesService.LibraryQuery = {}) {
  const user = await requireUser();
  return seriesService.getAllSeries(user.id, { ...query, search: query.search?.slice(0, 200) });
}

export const getLibraryFormats = cache(async function getLibraryFormats() {
  const user = await requireUser();
  return seriesService.getLibraryFormats(user.id);
});

export async function checkDuplicateSeries(mangadexId: string): Promise<boolean> {
  const user = await requireUser();
  return seriesService.checkDuplicateSeries(user.id, mangadexId);
}

export async function getExistingMangadexIds(mangadexIds: string[]): Promise<string[]> {
  const user = await requireUser();
  return seriesService.getExistingMangadexIds(user.id, mangadexIds);
}

export async function getExistingOpenLibraryKeys(keys: string[]): Promise<string[]> {
  const user = await requireUser();
  // Bounded like a search page; anything else isn't a key we stored.
  const valid = keys.slice(0, 50).filter((k) => openLibraryKeySchema.safeParse(k).success);
  return seriesService.getExistingOpenLibraryKeys(user.id, valid);
}

/** Whether any volume in the user's library holds this ISBN. */
export async function isIsbnInLibrary(isbn: string): Promise<boolean> {
  const user = await requireUser();
  const parsed = parseIsbnQuery(isbn);
  if (!parsed) return false;
  return (await findVolumeByIsbn(user.id, toStoredIsbn(parsed))) !== null;
}

export const getFormatCounts = cache(async function getFormatCounts() {
  const user = await requireUser();
  return seriesService.getFormatCounts(user.id);
});

export const getSeriesStats = cache(async function getSeriesStats() {
  const user = await requireUser();
  return seriesService.getSeriesStats(user.id);
});

export async function getRecentSeries() {
  const user = await requireUser();
  return seriesService.getRecentSeries(user.id);
}
