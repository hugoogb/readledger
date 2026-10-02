import { describe, it, expect } from "vitest";
import { formatDateForInput, formatShortDate, formatRelativeDate } from "@/utils/date";

describe("formatDateForInput", () => {
  it("formats a Date object to YYYY-MM-DD", () => {
    const result = formatDateForInput(new Date("2024-03-15T10:00:00Z"));
    expect(result).toBe("2024-03-15");
  });

  it("formats a date string to YYYY-MM-DD", () => {
    const result = formatDateForInput("2024-06-01T00:00:00.000Z");
    expect(result).toBe("2024-06-01");
  });

  it("returns empty string for null", () => {
    expect(formatDateForInput(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatDateForInput(undefined)).toBe("");
  });

  it("returns empty string for invalid date string", () => {
    expect(formatDateForInput("not-a-date")).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(formatDateForInput("")).toBe("");
  });

  it("handles ISO date strings", () => {
    const result = formatDateForInput("2023-12-25");
    expect(result).toBe("2023-12-25");
  });
});

describe("formatShortDate", () => {
  it("formats in UTC", () => {
    expect(formatShortDate(new Date("2026-01-08T00:00:00Z"))).toBe("Jan 8, 2026");
  });
});

describe("formatRelativeDate", () => {
  const now = new Date("2026-10-02T12:00:00Z");
  const ago = (days: number) => new Date(now.getTime() - days * 86_400_000);

  it.each([
    [0, "today"],
    [1, "yesterday"],
    [3, "3 days ago"],
    [20, "2 weeks ago"],
    [425, "14 months ago"],
    [800, "2 years ago"],
  ])("%i days → %s", (days, expected) => {
    expect(formatRelativeDate(ago(days), now)).toBe(expected);
  });
});
