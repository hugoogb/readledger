"use server";

import { searchMangaPaginated, fetchVolumeCovers } from "@/lib/manga-api";

export async function searchManga(query: string, page: number = 1) {
  return searchMangaPaginated(query, page);
}

export async function getVolumeCovers(
  mangadexId: string,
  totalVolumes: number,
) {
  return fetchVolumeCovers(mangadexId, totalVolumes);
}
