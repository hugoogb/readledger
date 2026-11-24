"use server";

import { requireUser } from "@/lib/auth";
import { withResult } from "@/lib/action-result";
import { revalidateLibrary } from "@/lib/revalidate";
import { cache } from "react";
import { idSchema, openLibraryKeySchema, seriesSchema, seriesVolumesSchema } from "@/lib/validations";
import { checkUserActionLimit } from "@/lib/rate-limit";
import { isbn13FromQuery } from "@/lib/isbn";
import * as seriesService from "@/services/series";
import { booksFirstInSearch } from "@/lib/format";
import { getPublishers } from "@/actions/publishers";
import { findVolumeByIsbn } from "@/services/isbn-volume";

export type { CreateSeriesInput, UpdateSeriesInput, VolumeInput, SortOption, LibraryQuery } from "@/services/series";

export const createSeries = withResult(async (
  input: seriesService.CreateSeriesInput,
  volumes: seriesService.VolumeInput[] = [],
) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validated = seriesSchema.parse(input);
  const validatedVolumes = seriesVolumesSchema.parse(volumes);

  const series = await seriesService.createSeries(user.id, validated, validatedVolumes);

  revalidateLibrary();

  return series;
});

export const updateSeries = withResult(async (id: string, input: seriesService.UpdateSeriesInput) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validated = seriesSchema.partial().parse(input);

  const updated = await seriesService.updateSeries(user.id, id, validated);

  revalidateLibrary([id]);

  return updated;
});

export const deleteSeries = withResult(async (id: string) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);

  await seriesService.deleteSeries(user.id, id);

  revalidateLibrary();
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
  const isbn13 = isbn13FromQuery(isbn);
  if (!isbn13) return false;
  return (await findVolumeByIsbn(user.id, isbn13)) !== null;
}

export const getFormatCounts = cache(async function getFormatCounts() {
  const user = await requireUser();
  return seriesService.getFormatCounts(user.id);
});

/** What the add-a-book flow needs, fetched when it opens rather than on every page. */
export async function getAddBookOptions(): Promise<{
  publishers: { id: string; name: string }[];
  booksFirst: boolean;
}> {
  const [publishers, formatCounts] = await Promise.all([getPublishers(), getFormatCounts()]);
  return {
    publishers: publishers.map(({ id, name }) => ({ id, name })),
    booksFirst: booksFirstInSearch(formatCounts),
  };
}

export const getSeriesStats = cache(async function getSeriesStats() {
  const user = await requireUser();
  return seriesService.getSeriesStats(user.id);
});

export async function getRecentSeries() {
  const user = await requireUser();
  // Six fills one row of the desktop cover shelf.
  return seriesService.getRecentSeries(user.id, 6);
}
