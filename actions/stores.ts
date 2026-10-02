"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { withResult } from "@/lib/action-result";
import { checkUserActionLimit } from "@/lib/rate-limit";
import { nameSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { cache } from "react";

export const getStores = cache(async function getStores() {
  const user = await requireUser();
  return prisma.userStore.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
});

export const createStore = withResult(async (name: string) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validName = nameSchema.parse(name);

  const created = await prisma.userStore.create({
    data: { userId: user.id, name: validName },
  });

  revalidatePath("/dashboard");
  return created;
});

export const updateStore = withResult(async (id: string, name: string) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validName = nameSchema.parse(name);

  const existing = await prisma.userStore.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) throw new NotFoundError("Store");

  const updated = await prisma.userStore.update({
    where: { id },
    data: { name: validName },
  });

  revalidatePath("/dashboard");
  return updated;
});

export const deleteStore = withResult(async (id: string) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const existing = await prisma.userStore.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) throw new NotFoundError("Store");

  await prisma.userStore.delete({ where: { id } });
  revalidatePath("/dashboard");
});
