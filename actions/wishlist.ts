"use server";

import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import * as wishlistService from "@/services/wishlist";

export async function toggleWishlist(volumeId: string) {
  const user = await requireUser();

  const { updated, seriesId } = await wishlistService.toggleWishlist(user.id, volumeId);

  revalidatePath(`/dashboard/series/${seriesId}`);
  revalidatePath("/dashboard/wishlist");

  return updated;
}

export async function getWishlistVolumes() {
  const user = await requireUser();
  return wishlistService.getWishlistVolumes(user.id);
}

export async function getWishlistStats() {
  const user = await requireUser();
  return wishlistService.getWishlistStats(user.id);
}
