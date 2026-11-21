"use server";

import { withResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import { ValidationError } from "@/lib/errors";
import { parseIsbnQuery, toStoredIsbn } from "@/lib/isbn";
import { checkRateLimit } from "@/lib/rate-limit";
import { idSchema, MAX_VOLUMES } from "@/lib/validations";
import * as isbnVolumeService from "@/services/isbn-volume";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type { VolumeMatch } from "@/services/isbn-volume";

const volumeNumberSchema = z.number().int().min(1).max(MAX_VOLUMES);

// Resolving can call Open Library, Google Books and MangaDex, so it shares
// one per-user budget with marking.
function limit(userId: string) {
  checkRateLimit(`isbn-volume:${userId}`, 30, 60_000);
}

/** Bare ISBN-13 for a valid ISBN-10/13 query; throws otherwise. */
function isbnInput(isbn: string): string {
  const parsed = parseIsbnQuery(isbn);
  if (!parsed) throw new ValidationError("Not a valid ISBN");
  return toStoredIsbn(parsed);
}

/** What a scanned ISBN most likely is in the library; null for a plain book. */
export const resolveIsbnVolume = withResult(async (isbn: string) => {
  const user = await requireUser();
  limit(user.id);
  return isbnVolumeService.resolveIsbnVolume(user.id, isbnInput(isbn));
});

/** Marks a series volume owned and stores the scanned ISBN on it. */
export const markVolumeOwnedByIsbn = withResult(
  async (seriesId: string, volumeNumber: number, isbn: string) => {
    const user = await requireUser();
    limit(user.id);
    const id = idSchema.parse(seriesId);
    await isbnVolumeService.markVolumeOwnedByIsbn(
      user.id,
      id,
      volumeNumberSchema.parse(volumeNumber),
      isbnInput(isbn),
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/library");
    revalidatePath(`/dashboard/library/${id}`);
    revalidatePath("/dashboard/wishlist");
  },
);

/** The user's series a scanned volume can be filed under (no standalones). */
export const listMultiVolumeSeries = withResult(async () => {
  const user = await requireUser();
  return isbnVolumeService.listMultiVolumeSeries(user.id);
});
