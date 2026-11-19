import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createThrottle, throttleMangadex, throttleOpenLibrary } from "@/lib/rate-limit";
import { AppError } from "@/lib/errors";

describe("createThrottle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
  });
  afterEach(() => vi.useRealTimers());

  /** Resolve times (ms after start) of each call. */
  function track(promises: Promise<void>[]) {
    const times: (number | "rejected")[] = [];
    promises.forEach((p, i) =>
      p.then(
        () => (times[i] = Date.now() - 10_000),
        () => (times[i] = "rejected"),
      ),
    );
    return times;
  }

  it("spaces concurrent callers one interval apart", async () => {
    const throttle = createThrottle(1000, 10_000);
    const times = track([throttle(), throttle(), throttle()]);
    await vi.advanceTimersByTimeAsync(3000);
    expect(times).toEqual([0, 1000, 2000]);
  });

  it("rejects with a busy error when the wait would exceed maxWaitMs", async () => {
    const throttle = createThrottle(1000, 1500);
    const calls = [throttle(), throttle(), throttle()];
    await expect(calls[2]).rejects.toBeInstanceOf(AppError);
    const times = track(calls.slice(0, 2));
    await vi.advanceTimersByTimeAsync(2000);
    expect(times).toEqual([0, 1000]);
  });

  it("does not reserve a slot for a rejected caller", async () => {
    const throttle = createThrottle(1000, 1000);
    const a = throttle();
    const b = throttle();
    await expect(throttle()).rejects.toBeInstanceOf(AppError);
    await vi.advanceTimersByTimeAsync(1000);
    await Promise.all([a, b]);
    // Next free slot is 2000 (after b at 1000), so a call now waits 1000.
    const times = track([throttle()]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(times).toEqual([2000]);
  });

  it("lets a call through immediately after an idle interval", async () => {
    const throttle = createThrottle(1000, 5000);
    await throttle();
    await vi.advanceTimersByTimeAsync(5000);
    const times = track([throttle()]);
    await vi.advanceTimersByTimeAsync(0);
    expect(times).toEqual([5000]);
  });
});

describe("shared upstream throttles", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Far past any slot an earlier test reserved on these module singletons.
    vi.setSystemTime(1_000_000);
  });
  afterEach(() => vi.useRealTimers());

  function resolveTimes(promises: Promise<void>[]) {
    const times: number[] = [];
    promises.forEach((p, i) => p.then(() => (times[i] = Date.now() - 1_000_000)));
    return times;
  }

  // Regression: the old MangaDex throttle compared against a shared "last
  // request" time, so concurrent callers all saw it stale and fired together.
  it("spaces concurrent MangaDex callers 200ms apart (5 req/s)", async () => {
    const times = resolveTimes([throttleMangadex(), throttleMangadex(), throttleMangadex()]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(times).toEqual([0, 200, 400]);
  });

  it("spaces concurrent Open Library callers for 3 req/s", async () => {
    vi.setSystemTime(2_000_000);
    const start = Date.now();
    const times: number[] = [];
    [throttleOpenLibrary(), throttleOpenLibrary(), throttleOpenLibrary(), throttleOpenLibrary()].forEach(
      (p, i) => p.then(() => (times[i] = Date.now() - start)),
    );
    await vi.advanceTimersByTimeAsync(2000);
    expect(times).toEqual([0, 334, 668, 1002]);
    // Never more than 3 requests in any 1-second window.
    expect(times[3] - times[0]).toBeGreaterThanOrEqual(1000);
  });
});
