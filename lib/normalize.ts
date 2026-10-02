/**
 * Forms send "" for a cleared optional text field. Store those as null so a
 * cleared field actually clears; `undefined` (field not sent) is left alone.
 */
export function blankToNull<T extends Record<string, unknown>, K extends keyof T>(
  data: T,
  keys: readonly K[],
): T {
  const out = { ...data };
  for (const key of keys) {
    if (out[key] === "") out[key] = null as T[K];
  }
  return out;
}
