/**
 * In-memory sliding window rate limiter.
 */

import { AppError } from "./errors";

type RateLimitEntry = {
  timestamps: number[];
  // Each key keeps its own window so cleanup doesn't cut long windows short
  // (e.g. the hourly OTP-send limit).
  windowMs: number;
};

const store = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
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

/**
 * Check if a request should be allowed.
 * @param key - Unique identifier (e.g., userId or "mangadex")
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed
 * @throws RateLimitError if rate limit exceeded
 */
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

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    throw new RateLimitError(
      `Rate limit exceeded. Please wait before trying again.`,
    );
  }

  entry.timestamps.push(now);
}

/**
 * Rate limiter for user actions (30 requests per minute)
 */
export function checkUserActionLimit(userId: string): void {
  checkRateLimit(`user:${userId}`, 30, 60_000);
}

/**
 * Serialised outbound throttle: callers are given slots `intervalMs` apart.
 * The slot is reserved before awaiting, so concurrent callers can't all see
 * the same "last request" time and fire together. A caller whose slot would
 * be more than `maxWaitMs` away is rejected (without reserving) instead of
 * queueing indefinitely.
 */
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

/**
 * MangaDex asks for at most 5 requests/second per client. One server IP
 * serves every user.
 */
export const throttleMangadex = createThrottle(
  200,
  5000,
  "Manga search is busy. Please try again in a moment.",
);

/**
 * Open Library allows 3 requests/second for clients that identify themselves
 * with a contact email in the User-Agent (we do; see lib/openlibrary-api.ts),
 * 1/s otherwise. One server IP serves every user.
 */
export const throttleOpenLibrary = createThrottle(
  334,
  5000,
  "Book search is busy. Please try again in a moment.",
);

/** Google Books is only an ISBN fallback (see lib/isbn-lookup.ts); 1/s is plenty. */
export const throttleGoogleBooks = createThrottle(
  1000,
  5000,
  "Book search is busy. Please try again in a moment.",
);
