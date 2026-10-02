import { describe, expect, it } from "vitest";
import {
  availableYears,
  averageBuyToRead,
  backlogTrend,
  bestPeriod,
  comparisonToLastYear,
  currentStreak,
  goalProgress,
  oldestUnread,
  readCount,
  readsByMonth,
  readsByYear,
  recentlyRead,
  seriesTimeline,
  topSeries,
  undatedReadCount,
  type ReadingVolume,
} from "@/lib/reading-stats";

const d = (iso: string) => new Date(iso);
let seq = 0;

function vol(overrides: Partial<ReadingVolume> = {}): ReadingVolume {
  seq += 1;
  return {
    id: `v${seq}`,
    seriesId: "s1",
    volumeNumber: seq,
    owned: true,
    read: false,
    purchaseDate: null,
    readDate: null,
    coverImage: null,
    series: { title: "Berserk", coverImage: null },
    ...overrides,
  };
}

const read = (readDate: string, extra: Partial<ReadingVolume> = {}) =>
  vol({ read: true, readDate: d(readDate), ...extra });

const NOW = d("2026-10-02T12:00:00Z");

describe("undatedReadCount", () => {
  it("counts read volumes without a read date", () => {
    const volumes = [vol({ read: true }), read("2026-01-01"), vol()];
    expect(undatedReadCount(volumes)).toBe(1);
  });
});

describe("availableYears", () => {
  it("returns read years plus the current year, descending", () => {
    const volumes = [read("2024-05-01"), read("2024-06-01"), read("2022-01-01")];
    expect(availableYears(volumes, NOW)).toEqual([2026, 2024, 2022]);
  });

  it("returns only the current year with no reads", () => {
    expect(availableYears([], NOW)).toEqual([2026]);
  });
});

describe("readsByMonth", () => {
  it("zero-fills all twelve months", () => {
    const result = readsByMonth([read("2026-03-10"), read("2026-03-20")], 2026);
    expect(result).toHaveLength(12);
    expect(result[0]).toEqual({ month: "2026-01", count: 0 });
    expect(result[2]).toEqual({ month: "2026-03", count: 2 });
  });

  it("buckets by UTC month", () => {
    const result = readsByMonth([read("2026-01-01T00:30:00Z"), read("2025-12-31T23:30:00Z")], 2026);
    expect(result[0].count).toBe(1);
  });

  it("ignores undated reads", () => {
    const result = readsByMonth([vol({ read: true })], 2026);
    expect(result.every((m) => m.count === 0)).toBe(true);
  });
});

describe("readsByYear", () => {
  it("zero-fills from the first read year to the current year", () => {
    const result = readsByYear([read("2023-02-01"), read("2025-02-01"), read("2025-03-01")], NOW);
    expect(result).toEqual([
      { year: 2023, count: 1 },
      { year: 2024, count: 0 },
      { year: 2025, count: 2 },
      { year: 2026, count: 0 },
    ]);
  });

  it("is empty with no reads", () => {
    expect(readsByYear([], NOW)).toEqual([]);
  });
});

describe("readCount", () => {
  const volumes = [read("2026-01-05"), read("2025-12-31"), vol({ read: true })];

  it("counts dated reads within a year", () => {
    expect(readCount(volumes, 2026)).toBe(1);
  });

  it("counts every dated read for all", () => {
    expect(readCount(volumes, "all")).toBe(2);
  });
});

describe("comparisonToLastYear", () => {
  it("compares the current year with last year up to the same date", () => {
    const volumes = [
      read("2026-02-01"),
      read("2026-09-01"),
      read("2025-03-01"),
      read("2025-11-01"), // after Oct 2 — not counted
    ];
    expect(comparisonToLastYear(volumes, 2026, NOW)).toEqual({
      current: 2,
      previous: 1,
      delta: 1,
    });
  });

  it("compares full years for a past year", () => {
    const volumes = [read("2025-12-01"), read("2024-01-01"), read("2024-12-31")];
    expect(comparisonToLastYear(volumes, 2025, NOW)).toEqual({
      current: 1,
      previous: 2,
      delta: -1,
    });
  });
});

describe("bestPeriod", () => {
  it("returns the month with most reads, earliest on ties", () => {
    const volumes = [read("2026-02-01"), read("2026-05-01"), read("2026-05-02"), read("2026-07-01"), read("2026-07-02")];
    expect(bestPeriod(volumes, 2026)).toEqual({ label: "2026-05", count: 2 });
  });

  it("returns the best year for all", () => {
    const volumes = [read("2024-01-01"), read("2025-01-01"), read("2025-02-01")];
    expect(bestPeriod(volumes, "all")).toEqual({ label: "2025", count: 2 });
  });

  it("returns null without reads", () => {
    expect(bestPeriod([], 2026)).toBeNull();
  });
});

describe("averageBuyToRead", () => {
  it("averages whole days between purchase and read", () => {
    const volumes = [
      read("2026-01-11", { purchaseDate: d("2026-01-01") }), // 10
      read("2026-02-21", { purchaseDate: d("2026-02-01") }), // 20
    ];
    expect(averageBuyToRead(volumes, 2026)).toBe(15);
  });

  it("excludes reads before purchase and reads without a purchase date", () => {
    const volumes = [
      read("2026-01-11", { purchaseDate: d("2026-01-01") }),
      read("2026-01-01", { purchaseDate: d("2026-03-01") }),
      read("2026-01-05"),
    ];
    expect(averageBuyToRead(volumes, 2026)).toBe(10);
  });

  it("returns null when nothing qualifies", () => {
    expect(averageBuyToRead([read("2026-01-05")], 2026)).toBeNull();
  });
});

describe("currentStreak", () => {
  // NOW is Friday 2026-10-02; its ISO week starts Monday 2026-09-28.
  it("counts consecutive weeks including the current one", () => {
    const volumes = [read("2026-09-29"), read("2026-09-22"), read("2026-09-14")];
    expect(currentStreak(volumes, NOW)).toBe(3);
  });

  it("does not break on an empty current week", () => {
    const volumes = [read("2026-09-22"), read("2026-09-15")];
    expect(currentStreak(volumes, NOW)).toBe(2);
  });

  it("is zero when the last read is older than last week", () => {
    expect(currentStreak([read("2026-09-10")], NOW)).toBe(0);
  });

  it("continues across New Year", () => {
    const now = d("2026-01-06T10:00:00Z"); // Tuesday
    const volumes = [read("2026-01-05"), read("2025-12-30"), read("2025-12-22")];
    expect(currentStreak(volumes, now)).toBe(3);
  });

  it("treats Sunday as the end of the week", () => {
    const now = d("2026-10-04T23:00:00Z"); // Sunday, same week as Monday 09-28
    expect(currentStreak([read("2026-09-28")], now)).toBe(1);
  });
});

describe("backlogTrend", () => {
  const volumes = [
    vol({ purchaseDate: d("2026-01-10") }), // unread throughout
    vol({ purchaseDate: d("2026-01-15"), read: true, readDate: d("2026-03-05") }),
    vol({ purchaseDate: d("2026-02-01") }),
    vol({ purchaseDate: null }), // owned, undated → excluded
    vol({ purchaseDate: d("2026-01-01"), read: true }), // read without date → excluded
  ];

  it("returns month-end points up to the current month", () => {
    const result = backlogTrend(volumes, 2026, d("2026-04-15T00:00:00Z"));
    expect(result).toEqual([
      { label: "2026-01", count: 2 },
      { label: "2026-02", count: 3 },
      { label: "2026-03", count: 2 },
      { label: "2026-04", count: 2 },
    ]);
  });

  it("returns twelve points for a past year", () => {
    expect(backlogTrend(volumes, 2025, NOW)).toHaveLength(12);
  });

  it("returns year-end points for all", () => {
    const all = [vol({ purchaseDate: d("2025-06-01") }), ...volumes];
    expect(backlogTrend(all, "all", NOW)).toEqual([
      { label: "2025", count: 1 },
      { label: "2026", count: 3 },
    ]);
  });
});

describe("topSeries", () => {
  it("ranks series by reads in the period, ties by title", () => {
    const volumes = [
      read("2026-01-01", { seriesId: "a", series: { title: "Vagabond", coverImage: null } }),
      read("2026-01-02", { seriesId: "b", series: { title: "Berserk", coverImage: "b.jpg" } }),
      read("2026-01-03", { seriesId: "c", series: { title: "Monster", coverImage: null } }),
      read("2026-01-04", { seriesId: "c", series: { title: "Monster", coverImage: null } }),
      read("2025-01-04", { seriesId: "a", series: { title: "Vagabond", coverImage: null } }),
    ];
    expect(topSeries(volumes, 2026, 2)).toEqual([
      { seriesId: "c", title: "Monster", coverImage: null, count: 2 },
      { seriesId: "b", title: "Berserk", coverImage: "b.jpg", count: 1 },
    ]);
  });
});

describe("oldestUnread", () => {
  it("lists owned unread volumes by purchase date", () => {
    const a = vol({ purchaseDate: d("2025-01-01") });
    const b = vol({ purchaseDate: d("2024-01-01") });
    const volumes = [a, b, vol({ purchaseDate: null }), read("2026-01-01", { purchaseDate: d("2020-01-01") }), vol({ owned: false, purchaseDate: d("2020-01-01") })];
    expect(oldestUnread(volumes, 5).map((v) => v.id)).toEqual([b.id, a.id]);
  });
});

describe("recentlyRead", () => {
  it("lists dated reads newest first", () => {
    const a = read("2026-01-01");
    const b = read("2026-03-01");
    expect(recentlyRead([a, vol({ read: true }), b], 5).map((v) => v.id)).toEqual([b.id, a.id]);
  });
});

describe("goalProgress", () => {
  it("is null without a goal", () => {
    expect(goalProgress(null, 10, 2026, NOW)).toBeNull();
  });

  it("computes pace for the current year", () => {
    // 2026-10-02 is day 275 of 365.
    const result = goalProgress({ year: 2026, target: 73 }, 50, 2026, NOW);
    expect(result).toEqual({ target: 73, read: 50, completed: false, expected: 55, paceDelta: -5 });
  });

  it("expects almost nothing on Jan 1 and the full target on Dec 31", () => {
    expect(goalProgress({ year: 2026, target: 365 }, 0, 2026, d("2026-01-01T08:00:00Z"))?.expected).toBe(1);
    expect(goalProgress({ year: 2026, target: 60 }, 0, 2026, d("2026-12-31T08:00:00Z"))?.expected).toBe(60);
  });

  it("uses 366 days in a leap year", () => {
    expect(goalProgress({ year: 2028, target: 366 }, 0, 2028, d("2028-12-31T08:00:00Z"))?.expected).toBe(366);
  });

  it("has no pace for a past year", () => {
    expect(goalProgress({ year: 2025, target: 40 }, 48, 2025, NOW)).toEqual({
      target: 40,
      read: 48,
      completed: true,
    });
  });
});

describe("seriesTimeline", () => {
  it("summarises collecting and reading dates", () => {
    const volumes = [
      vol({ purchaseDate: d("2026-01-01"), read: true, readDate: d("2026-01-08") }),
      vol({ purchaseDate: d("2026-01-01"), read: true, readDate: d("2026-01-22") }),
      vol({ purchaseDate: d("2026-02-01") }),
      vol({ owned: false }),
    ];
    expect(seriesTimeline(volumes)).toEqual({
      startedCollecting: d("2026-01-01"),
      firstRead: d("2026-01-08"),
      lastRead: d("2026-01-22"),
      pacePerWeek: 1,
      averageBuyToRead: 14,
    });
  });

  it("omits pace with a single read or a span under a week", () => {
    const volumes = [read("2026-01-01"), read("2026-01-03")];
    expect(seriesTimeline(volumes).pacePerWeek).toBeNull();
    expect(seriesTimeline([read("2026-01-01")]).pacePerWeek).toBeNull();
  });

  it("returns all nulls with no dates", () => {
    expect(seriesTimeline([vol()])).toEqual({
      startedCollecting: null,
      firstRead: null,
      lastRead: null,
      pacePerWeek: null,
      averageBuyToRead: null,
    });
  });
});
