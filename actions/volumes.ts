"use server";

import { requireUser } from "@/lib/auth";
import { withResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { revalidateLibrary } from "@/lib/revalidate";
import {
  bulkOwnedPayloadSchema,
  idSchema,
  readDateSchema,
  volumeIdsSchema,
  volumeSchema,
} from "@/lib/validations";
import { checkUserActionLimit } from "@/lib/rate-limit";
import * as volumeService from "@/services/volumes";
import type { z } from "zod";

export type { CreateVolumeInput, UpdateVolumeInput } from "@/services/volumes";

export const createVolume = withResult(async (input: volumeService.CreateVolumeInput) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validated = volumeSchema.parse(input);
  const seriesId = idSchema.parse(input.seriesId);

  const volume = await volumeService.createVolume(user.id, { ...validated, seriesId });

  revalidateLibrary([seriesId]);

  return volume;
});

export const updateVolume = withResult(async (id: string, input: volumeService.UpdateVolumeInput) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validated = volumeSchema.partial().parse(input);

  const updated = await volumeService.updateVolume(user.id, id, validated);

  revalidateLibrary();
  revalidatePath("/dashboard/wishlist");

  return updated;
});

export const deleteVolume = withResult(async (id: string) => {
  const user = await requireUser();

  const seriesId = await volumeService.deleteVolume(user.id, id);

  revalidateLibrary([seriesId]);
});

export const toggleVolumeRead = withResult(async (id: string, today?: string) => {
  const user = await requireUser();

  const { updated, seriesId } = await volumeService.toggleVolumeRead(user.id, id, today);

  // Reading a standalone book can change its status, shown in the list too.
  revalidateLibrary([seriesId]);

  return updated;
});

export const bulkMarkOwned = withResult(
  async (volumeIds: string[], data: z.input<typeof bulkOwnedPayloadSchema>) => {
    const user = await requireUser();
    checkUserActionLimit(user.id);
    const ids = volumeIdsSchema.parse(volumeIds);
    const payload = bulkOwnedPayloadSchema.parse(data);

    revalidateLibrary(await volumeService.bulkMarkOwned(user.id, ids, payload));
  },
);

export const bulkSetRead = withResult(async (volumeIds: string[], readDate?: Date) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const ids = volumeIdsSchema.parse(volumeIds);

  revalidateLibrary(await volumeService.bulkSetRead(user.id, ids, readDateSchema.parse(readDate)));
});
