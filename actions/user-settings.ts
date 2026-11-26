"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { currencySchema, displayNameSchema } from "@/lib/validations";
import { withResult } from "@/lib/action-result";

export const updateCurrency = withResult(async (currency: string) => {
  const user = await requireUser();
  const code = currencySchema.parse(currency);

  await prisma.user.update({
    where: { id: user.id },
    data: { currency: code },
  });

  revalidatePath("/dashboard", "layout");
});

export const updateDisplayName = withResult(async (name: string) => {
  const user = await requireUser();
  const validName = displayNameSchema.parse(name);

  await prisma.user.update({
    where: { id: user.id },
    data: { name: validName },
  });

  revalidatePath("/dashboard", "layout");
});
