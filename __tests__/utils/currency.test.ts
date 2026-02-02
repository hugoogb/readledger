import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/utils/currency";

describe("formatCurrency", () => {
  it("formats a positive number as EUR by default", () => {
    const result = formatCurrency(9.95);
    expect(result).toContain("9,95");
    expect(result).toContain("€");
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0,00");
  });

  it("formats large numbers", () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain("1234,56");
    expect(result).toContain("€");
  });

  it("always shows two decimal places", () => {
    const result = formatCurrency(10);
    expect(result).toContain("10,00");
  });

  it("rounds to two decimal places", () => {
    const result = formatCurrency(9.999);
    expect(result).toContain("10,00");
  });

  it("handles negative numbers", () => {
    const result = formatCurrency(-5.5);
    expect(result).toContain("5,50");
  });

  it("supports USD currency", () => {
    const result = formatCurrency(10, "USD");
    expect(result).toContain("$");
    expect(result).toContain("10.00");
  });

  it("supports GBP currency", () => {
    const result = formatCurrency(10, "GBP");
    expect(result).toContain("£");
  });
});
