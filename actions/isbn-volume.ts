"use server";

import { withResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import { ValidationError } from "@/lib/errors";
import { isbn13FromQuery } from "@/lib/isbn";
import { checkRateLimit } from "@/lib/rate-limit";
import { idSchema, MAX_VOLUMES } from "@/lib/validations";
import * as isbnVolumeService from "@/services/isbn-volume";
import { revalidatePath } from "next/cache";
import { revalidateLibrary } from "@/lib/revalidate";
import { z } from "zod";

export type { VolumeMatch } from "@/services/isbn-volume";

const volumeNumberSchema = z.number().int().min(1).max(MAX_VOLUMES);

function limit(userId: string) {
  checkRateLimit(`isbn-volume:${userId}`, 30, 60_000);
}

function isbnInput(isbn: string): string {
  const isbn13 = isbn13FromQuery(isbn);
  if (!isbn13) throw new ValidationError("Not a valid ISBN");
  return isbn13;
}

export const resolveIsbnVolume = withResult(async (isbn: string) => {
  const user = await requireUser();
  limit(user.id);
  return isbnVolumeService.resolveIsbnVolume(user.id, isbnInput(isbn));
});

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

    revalidateLibrary([id]);
    revalidatePath("/dashboard/wishlist");
  },
);

export const listMultiVolumeSeries = withResult(async () => {
  const user = await requireUser();
  return isbnVolumeService.listMultiVolumeSeries(user.id);
});
