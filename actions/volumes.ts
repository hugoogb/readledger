"use server";

import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
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

export async function toggleVolumeOwned(id: string) {
  const user = await requireUser();

  const { updated, seriesId } = await volumeService.toggleVolumeOwned(user.id, id);

  revalidatePath(`/dashboard/series/${seriesId}`);

  return updated;
}

export async function toggleVolumeRead(id: string) {
  const user = await requireUser();

  const { updated, seriesId } = await volumeService.toggleVolumeRead(user.id, id);

  revalidatePath(`/dashboard/series/${seriesId}`);

  return updated;
}

export async function markVolumesOwned(
  seriesId: string,
  volumeNumbers: number[],
  owned: boolean,
) {
  const user = await requireUser();

  await volumeService.markVolumesOwned(user.id, seriesId, volumeNumbers, owned);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${seriesId}`);
}

export async function markVolumesRead(
  seriesId: string,
  volumeNumbers: number[],
  read: boolean,
) {
  const user = await requireUser();

  await volumeService.markVolumesRead(user.id, seriesId, volumeNumbers, read);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${seriesId}`);
}

export async function markVolumesOwnedUpTo(
  seriesId: string,
  upToVolume: number,
) {
  const user = await requireUser();

  await volumeService.markVolumesOwnedUpTo(user.id, seriesId, upToVolume);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${seriesId}`);
}

export async function markAllOwnedAsRead(seriesId: string) {
  const user = await requireUser();

  await volumeService.markAllOwnedAsRead(user.id, seriesId);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath(`/dashboard/series/${seriesId}`);
}

export async function getVolumeStats(seriesId: string) {
  const user = await requireUser();
  return volumeService.getVolumeStats(user.id, seriesId);
}

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

export async function bulkSetRead(volumeIds: string[]) {
  const user = await requireUser();

  const seriesIds = await volumeService.bulkSetRead(user.id, volumeIds);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  for (const seriesId of seriesIds) {
    revalidatePath(`/dashboard/series/${seriesId}`);
  }
}
