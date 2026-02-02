"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
