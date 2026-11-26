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
