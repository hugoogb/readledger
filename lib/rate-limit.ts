/**
 * In-memory sliding window rate limiter.
 */

type RateLimitEntry = {
  timestamps: number[];
};

const store = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 120_000);
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
    entry = { timestamps: [] };
    store.set(key, entry);
  }

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
 * Delay helper for throttling external API calls.
 * MangaDex recommends max 5 requests per second.
 */
let lastMangadexRequest = 0;

export async function throttleMangadex(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastMangadexRequest;
  const minInterval = 200; // 5 req/s

  if (elapsed < minInterval) {
    await new Promise((resolve) => setTimeout(resolve, minInterval - elapsed));
  }

  lastMangadexRequest = Date.now();
}
