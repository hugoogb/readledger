"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getPublishers() {
  const user = await requireUser();
  return prisma.publisher.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
}

export async function createPublisher(name: string) {
  const user = await requireUser();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Publisher name is required");

  const publisher = await prisma.publisher.create({
    data: { userId: user.id, name: trimmed },
  });

  revalidatePath("/dashboard");
  return publisher;
}

export async function updatePublisher(id: string, name: string) {
  const user = await requireUser();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Publisher name is required");

  const publisher = await prisma.publisher.findFirst({
    where: { id, userId: user.id },
  });
  if (!publisher) throw new Error("Publisher not found");

  const updated = await prisma.publisher.update({
    where: { id },
    data: { name: trimmed },
  });

  revalidatePath("/dashboard");
  return updated;
}

export async function deletePublisher(id: string) {
  const user = await requireUser();
  const publisher = await prisma.publisher.findFirst({
    where: { id, userId: user.id },
  });
  if (!publisher) throw new Error("Publisher not found");

  await prisma.publisher.delete({ where: { id } });
  revalidatePath("/dashboard");
}
