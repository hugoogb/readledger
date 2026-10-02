import { describe, it, expect } from "vitest";
import {
  formatDateForInput,
  formatShortDate,
  formatRelativeDate,
  parseDateInput,
  startOfUtcDay,
  todayInputValue,
} from "@/utils/date";

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

describe("calendar date helpers", () => {
  it("todayInputValue uses the local calendar day", () => {
    const localLateNight = new Date(2026, 0, 1, 0, 30); // 00:30 local time
    expect(todayInputValue(localLateNight)).toBe("2026-01-01");
  });

  it("startOfUtcDay truncates to UTC midnight", () => {
    expect(startOfUtcDay(new Date("2026-03-05T22:30:00Z"))).toEqual(
      new Date("2026-03-05T00:00:00Z"),
    );
  });

  it("parseDateInput accepts real YYYY-MM-DD dates only", () => {
    expect(parseDateInput("2026-01-31")).toEqual(new Date("2026-01-31T00:00:00Z"));
    expect(parseDateInput("2026-02-30")).toBeNull();
    expect(parseDateInput("31/01/2026")).toBeNull();
    expect(parseDateInput("")).toBeNull();
    expect(parseDateInput(undefined)).toBeNull();
  });
});
