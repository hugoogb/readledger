import type { ActionResult } from "@/lib/action-result";

/** Client-side: return an action's data or throw its user-facing error. */
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
