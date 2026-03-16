import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TTLCache } from "@/lib/cache";

describe("TTLCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and retrieves values", () => {
    const cache = new TTLCache<string>(1000);
    cache.set("key", "value");
    expect(cache.get("key")).toBe("value");
  });

  it("returns undefined for missing keys", () => {
    const cache = new TTLCache<string>(1000);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("expires entries after TTL", () => {
    const cache = new TTLCache<string>(1000);
    cache.set("key", "value");
    expect(cache.get("key")).toBe("value");

    vi.advanceTimersByTime(1001);
    expect(cache.get("key")).toBeUndefined();
  });

  it("does not expire entries before TTL", () => {
    const cache = new TTLCache<string>(1000);
    cache.set("key", "value");

    vi.advanceTimersByTime(999);
    expect(cache.get("key")).toBe("value");
  });

  it("evicts oldest entry when maxSize is reached", () => {
    const cache = new TTLCache<string>(10_000, 2);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3"); // should evict "a"

    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe("2");
    expect(cache.get("c")).toBe("3");
  });

  it("overwrites existing keys", () => {
    const cache = new TTLCache<string>(1000);
    cache.set("key", "old");
    cache.set("key", "new");
    expect(cache.get("key")).toBe("new");
  });
});
