import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** An error's message for logs and toasts; `fallback` when it isn't an Error. */
export function errorMessage(err: unknown, fallback = String(err)): string {
  return err instanceof Error ? err.message : fallback;
}

/** "1 book", "3 books". */
export function plural(count: number, word: string): string {
  return `${count} ${word}${count !== 1 ? "s" : ""}`;
}
