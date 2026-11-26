import { revalidatePath } from "next/cache";

export function revalidateLibrary(...seriesIds: Iterable<string>[]) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/library");
  for (const ids of seriesIds) {
    for (const id of ids) revalidatePath(`/dashboard/library/${id}`);
  }
}
