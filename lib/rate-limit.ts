import { AppError } from "./errors";

type RateLimitEntry = {
  timestamps: number[];
  windowMs: number;
};

const store = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < entry.windowMs);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 60_000);

export class RateLimitError extends Error {
  constructor(message = "Too many requests") {
    super(message);
    this.name = "RateLimitError";
  }
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): void {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry) {
    entry = { timestamps: [], windowMs };
    store.set(key, entry);
  }
  entry.windowMs = Math.max(entry.windowMs, windowMs);

  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    throw new RateLimitError(
      `Rate limit exceeded. Please wait before trying again.`,
    );
  }

  entry.timestamps.push(now);
}

export function checkUserActionLimit(userId: string): void {
  checkRateLimit(`user:${userId}`, 30, 60_000);
}

export function createThrottle(
  intervalMs: number,
  maxWaitMs: number,
  busyMessage = "Search is busy. Please try again in a moment.",
): () => Promise<void> {
  let nextSlot = 0;
  return async () => {
    const now = Date.now();
    const slot = Math.max(now, nextSlot);
    const wait = slot - now;
    if (wait > maxWaitMs) {
      throw new AppError(busyMessage);
    }
    nextSlot = slot + intervalMs;
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  };
}

export const throttleMangadex = createThrottle(
  200,
  5000,
  "Manga search is busy. Please try again in a moment.",
);

export const throttleOpenLibrary = createThrottle(
  334,
  5000,
  "Book search is busy. Please try again in a moment.",
);

export const throttleGoogleBooks = createThrottle(
  1000,
  5000,
  "Book search is busy. Please try again in a moment.",
);
