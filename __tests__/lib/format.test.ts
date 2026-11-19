import {
  FORMAT_LABELS,
  booksFirstInSearch,
  formatBreakdown,
  isStandalone,
  parseFormat,
  standaloneStatusAfterRead,
  volumeLabel,
} from "@/lib/format";
import { describe, expect, it } from "vitest";

describe("isStandalone", () => {
  it("is true for one total volume with zero or one row", () => {
    expect(isStandalone(1, 0)).toBe(true);
    expect(isStandalone(1, 1)).toBe(true);
  });

  it("renders as a series when one total volume has several rows", () => {
    expect(isStandalone(1, 2)).toBe(false);
  });

  it("is false for an unknown-length series with one row", () => {
    expect(isStandalone(null, 1)).toBe(false);
  });

  it("is false for multi-volume and empty titles", () => {
    expect(isStandalone(2, 1)).toBe(false);
    expect(isStandalone(0, 0)).toBe(false);
  });
});

describe("volumeLabel", () => {
  it("is just the title for a standalone book", () => {
    expect(volumeLabel("Dune", 1, true)).toBe("Dune");
  });

  it("adds the volume number for a series", () => {
    expect(volumeLabel("One Piece", 3, false)).toBe("One Piece · Vol 3");
  });
});

describe("standaloneStatusAfterRead", () => {
  it("completes a book when it is read", () => {
    expect(standaloneStatusAfterRead("READING", true)).toBe("COMPLETED");
    expect(standaloneStatusAfterRead("PLAN_TO_READ", true)).toBe("COMPLETED");
  });

  it("leaves an already completed book alone when read", () => {
    expect(standaloneStatusAfterRead("COMPLETED", true)).toBeNull();
  });

  it("moves a completed book back to reading when un-read", () => {
    expect(standaloneStatusAfterRead("COMPLETED", false)).toBe("READING");
  });

  it("keeps other statuses when un-read", () => {
    expect(standaloneStatusAfterRead("DROPPED", false)).toBeNull();
    expect(standaloneStatusAfterRead("ON_HOLD", false)).toBeNull();
  });
});

describe("parseFormat", () => {
  it("accepts enum values case-insensitively", () => {
    expect(parseFormat("novel")).toBe("NOVEL");
    expect(parseFormat(" LIGHT_NOVEL ")).toBe("LIGHT_NOVEL");
  });

  it("returns undefined for unknown or empty values", () => {
    expect(parseFormat("BOOK")).toBeUndefined();
    expect(parseFormat("")).toBeUndefined();
    expect(parseFormat(undefined)).toBeUndefined();
    expect(parseFormat(null)).toBeUndefined();
  });
});

describe("formatBreakdown", () => {
  it("sums owned books per format, largest first", () => {
    expect(
      formatBreakdown([
        { format: "NOVEL", ownedCount: 1 },
        { format: "MANGA", ownedCount: 4 },
        { format: "MANGA", ownedCount: 3 },
      ]),
    ).toEqual([
      { format: "MANGA", label: FORMAT_LABELS.MANGA, count: 7 },
      { format: "NOVEL", label: FORMAT_LABELS.NOVEL, count: 1 },
    ]);
  });

  it("keeps formats with nothing owned", () => {
    expect(formatBreakdown([{ format: "COMIC", ownedCount: 0 }])).toEqual([
      { format: "COMIC", label: "Comic", count: 0 },
    ]);
  });
});

describe("booksFirstInSearch", () => {
  it("puts manga first for libraries that are mostly manga and light novels", () => {
    expect(booksFirstInSearch({ MANGA: 10 })).toBe(false);
    expect(booksFirstInSearch({ MANGA: 2, LIGHT_NOVEL: 2, NOVEL: 3 })).toBe(false);
  });

  it("puts books first when other formats lead, or on a tie (including empty)", () => {
    expect(booksFirstInSearch({ MANGA: 1, NOVEL: 1, COMIC: 1 })).toBe(true);
    expect(booksFirstInSearch({ MANGA: 2, NONFICTION: 2 })).toBe(true);
    expect(booksFirstInSearch({})).toBe(true);
  });
});
