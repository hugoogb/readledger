"use server";

import { requireUser } from "@/lib/auth";
import { searchMangaPaginated, fetchVolumeCovers } from "@/lib/manga-api";
import { checkRateLimit } from "@/lib/rate-limit";
import { MAX_VOLUMES } from "@/lib/validations";
import { z } from "zod";

// Both actions proxy MangaDex through the shared throttle, so they require a
// session and bounded inputs to keep anonymous callers from tying it up.
const searchInput = z.object({
  query: z.string().trim().min(1).max(200),
  page: z.number().int().min(1).max(100),
});

const coversInput = z.object({
  mangadexId: z.uuid(),
  totalVolumes: z.number().int().min(0).max(MAX_VOLUMES),
});

export async function searchManga(query: string, page: number = 1) {
  const user = await requireUser();
  checkRateLimit(`mangadex:${user.id}`, 60, 60_000);
  const input = searchInput.parse({ query, page });
  return searchMangaPaginated(input.query, input.page);
}

export async function getVolumeCovers(
  mangadexId: string,
  totalVolumes: number,
) {
  const user = await requireUser();
  checkRateLimit(`mangadex:${user.id}`, 60, 60_000);
  const input = coversInput.parse({ mangadexId, totalVolumes });
  return fetchVolumeCovers(input.mangadexId, input.totalVolumes);
}
