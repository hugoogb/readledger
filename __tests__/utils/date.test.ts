import { describe, it, expect } from "vitest";
import { formatDateForInput } from "@/utils/date";

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
