"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { withResult } from "@/lib/action-result";
import { checkUserActionLimit } from "@/lib/rate-limit";
import { nameSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { cache } from "react";

export const getPublishers = cache(async function getPublishers() {
  const user = await requireUser();
  return prisma.publisher.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
});

export const createPublisher = withResult(async (name: string) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validName = nameSchema.parse(name);

  const created = await prisma.publisher.create({
    data: { userId: user.id, name: validName },
  });

  revalidatePath("/dashboard");
  return created;
});

export const updatePublisher = withResult(async (id: string, name: string) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validName = nameSchema.parse(name);

  const existing = await prisma.publisher.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) throw new NotFoundError("Publisher");

  const updated = await prisma.publisher.update({
    where: { id },
    data: { name: validName },
  });

  revalidatePath("/dashboard");
  return updated;
});

export const deletePublisher = withResult(async (id: string) => {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const existing = await prisma.publisher.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) throw new NotFoundError("Publisher");

  await prisma.publisher.delete({ where: { id } });
  revalidatePath("/dashboard");
});
