"use server";

import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { Condition } from "@/lib/generated/prisma/enums";
import { volumeSchema } from "@/lib/validations";
import { checkUserActionLimit } from "@/lib/rate-limit";
import * as volumeService from "@/services/volumes";

export type { CreateVolumeInput, UpdateVolumeInput } from "@/services/volumes";

export async function createVolume(input: volumeService.CreateVolumeInput) {
  const user = await requireUser();
  const validated = volumeSchema.parse(input);

  const volume = await volumeService.createVolume(user.id, {
    ...validated,
    seriesId: input.seriesId,
    volumeNumber: input.volumeNumber,
    condition: validated.condition as Condition | undefined,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${input.seriesId}`);

  return volume;
}

export async function updateVolume(id: string, input: volumeService.UpdateVolumeInput) {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validated = volumeSchema.partial().parse(input);

  const updated = await volumeService.updateVolume(user.id, id, validated);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");

  return updated;
}

export async function deleteVolume(id: string) {
  const user = await requireUser();

  const seriesId = await volumeService.deleteVolume(user.id, id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${seriesId}`);
}

export async function toggleVolumeRead(id: string) {
  const user = await requireUser();

  const { updated, seriesId } = await volumeService.toggleVolumeRead(user.id, id);

  revalidatePath(`/dashboard/series/${seriesId}`);

  return updated;
}

export const getVolumeStats = cache(async function getVolumeStats(seriesId: string) {
  const user = await requireUser();
  return volumeService.getVolumeStats(user.id, seriesId);
});

export async function bulkMarkOwned(
  volumeIds: string[],
  data: {
    pricePaid?: number;
    storeId?: string;
    condition: Condition;
    purchaseDate?: Date;
    notes?: string;
  },
) {
  const user = await requireUser();
  checkUserActionLimit(user.id);

  const seriesIds = await volumeService.bulkMarkOwned(user.id, volumeIds, data);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  for (const seriesId of seriesIds) {
    revalidatePath(`/dashboard/series/${seriesId}`);
  }
}

export async function bulkSetRead(volumeIds: string[], readDate?: Date) {
  const user = await requireUser();
  checkUserActionLimit(user.id);

  const seriesIds = await volumeService.bulkSetRead(user.id, volumeIds, readDate);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  for (const seriesId of seriesIds) {
    revalidatePath(`/dashboard/series/${seriesId}`);
  }
}
