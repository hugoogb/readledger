"use server";

import { requireUser } from "@/lib/auth";
import { checkUserActionLimit } from "@/lib/rate-limit";
import { readingGoalSchema } from "@/lib/validations";
import * as readingService from "@/services/reading";
import { revalidatePath } from "next/cache";
import { cache } from "react";

export const getReadingVolumes = cache(async function getReadingVolumes() {
  const user = await requireUser();
  return readingService.getReadingVolumes(user.id);
});

export const getReadingGoals = cache(async function getReadingGoals() {
  const user = await requireUser();
  return readingService.getReadingGoals(user.id);
});

export async function setReadingGoal(year: number, target: number) {
  const user = await requireUser();
  checkUserActionLimit(user.id);
  const validated = readingGoalSchema.parse({ year, target });

  await readingService.upsertReadingGoal(user.id, validated);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/statistics");
}

export async function deleteReadingGoal(year: number) {
  const user = await requireUser();
  checkUserActionLimit(user.id);

  await readingService.deleteReadingGoal(user.id, readingGoalSchema.shape.year.parse(year));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/statistics");
}
