"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { displayNameSchema } from "@/lib/validations";

export async function getUserSettings() {
  const user = await requireUser();
  return { currency: user.currency };
}

export async function updateCurrency(currency: string) {
  const user = await requireUser();
  const trimmed = currency.trim().toUpperCase();
  if (!trimmed || trimmed.length !== 3) {
    throw new Error("Currency must be a 3-letter code (e.g. EUR, USD)");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { currency: trimmed },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/series");
  revalidatePath("/dashboard/profile");
}

/**
 * `null` means "never asked" (shows the first-login prompt); an empty string
 * means the user chose not to set a name, so the prompt stays dismissed.
 */
export async function updateDisplayName(name: string) {
  const user = await requireUser();
  const parsed = displayNameSchema.safeParse(name);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data },
  });

  revalidatePath("/dashboard", "layout");
}
