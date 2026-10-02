"use server";

import { requireUser } from "@/lib/auth";
import { withResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { Condition } from "@/lib/generated/prisma/enums";
import { bulkOwnedPayloadSchema, idSchema, volumeIdsSchema, volumeSchema } from "@/lib/validations";
import { getSeries } from "@/actions/series";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { checkUserActionLimit } from "@/lib/rate-limit";
import * as volumeService from "@/services/volumes";

export type { CreateVolumeInput, UpdateVolumeInput } from "@/services/volumes";

export const createVolume = withResult(async (input: volumeService.CreateVolumeInput) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validated = volumeSchema.parse(input);
  const seriesId = idSchema.parse(input.seriesId);

  const volume = await volumeService.createVolume(user.id, {
    ...validated,
    seriesId,
    condition: validated.condition as Condition | undefined,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${seriesId}`);

  return volume;
});

export const updateVolume = withResult(async (id: string, input: volumeService.UpdateVolumeInput) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validated = volumeSchema.partial().parse(input);

  const updated = await volumeService.updateVolume(user.id, id, validated);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath("/dashboard/wishlist");

  return updated;
});

export const deleteVolume = withResult(async (id: string) => {
  const user = await requireUser();

  const seriesId = await volumeService.deleteVolume(user.id, id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${seriesId}`);
});

export const toggleVolumeRead = withResult(async (id: string, today?: string) => {
  const user = await requireUser();

  const { updated, seriesId } = await volumeService.toggleVolumeRead(user.id, id, today);

  revalidatePath(`/dashboard/series/${seriesId}`);

  return updated;
});

// Reuses the page's cached getSeries() instead of fetching the series again.
export const getVolumeStats = cache(async function getVolumeStats(seriesId: string) {
  const series = await getSeries(seriesId);
  if (!series) throw new NotFoundError("Series");
  return volumeService.computeVolumeStats(series);
});

export const bulkMarkOwned = withResult(async (
  volumeIds: string[],
  data: {
    pricePaid?: number;
    storeId?: string;
    condition: Condition;
    purchaseDate?: Date;
    notes?: string;
  },
) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const ids = volumeIdsSchema.parse(volumeIds);
  const payload = bulkOwnedPayloadSchema.parse(data);

  const seriesIds = await volumeService.bulkMarkOwned(user.id, ids, payload);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  for (const seriesId of seriesIds) {
    revalidatePath(`/dashboard/series/${seriesId}`);
  }
});

export const bulkSetRead = withResult(async (volumeIds: string[], readDate?: Date) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const ids = volumeIdsSchema.parse(volumeIds);
  if (readDate !== undefined && (!(readDate instanceof Date) || isNaN(readDate.getTime()))) {
    throw new ValidationError("Invalid read date");
  }

  const seriesIds = await volumeService.bulkSetRead(user.id, ids, readDate);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  for (const seriesId of seriesIds) {
    revalidatePath(`/dashboard/series/${seriesId}`);
  }
});
