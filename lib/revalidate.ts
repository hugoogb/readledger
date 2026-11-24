import { revalidatePath } from "next/cache";

/** After a library change: the dashboard, the library list and each title's page. */
export function revalidateLibrary(...seriesIds: Iterable<string>[]) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/library");
  for (const ids of seriesIds) {
    for (const id of ids) revalidatePath(`/dashboard/library/${id}`);
  }
}
