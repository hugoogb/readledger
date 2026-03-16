"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { revalidatePath } from "next/cache";

export async function getStores() {
  const user = await requireUser();
  return prisma.userStore.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
}

export async function createStore(name: string) {
  const user = await requireUser();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Store name is required");

  const store = await prisma.userStore.create({
    data: { userId: user.id, name: trimmed },
  });

  revalidatePath("/dashboard");
  return store;
}

export async function updateStore(id: string, name: string) {
  const user = await requireUser();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Store name is required");

  const store = await prisma.userStore.findFirst({
    where: { id, userId: user.id },
  });
  if (!store) throw new NotFoundError("Store");

  const updated = await prisma.userStore.update({
    where: { id },
    data: { name: trimmed },
  });

  revalidatePath("/dashboard");
  return updated;
}

export async function deleteStore(id: string) {
  const user = await requireUser();
  const store = await prisma.userStore.findFirst({
    where: { id, userId: user.id },
  });
  if (!store) throw new NotFoundError("Store");

  await prisma.userStore.delete({ where: { id } });
  revalidatePath("/dashboard");
}
