import { describe, expect, it } from "vitest";
import { CLOTH_COLORS, clothColor } from "@/lib/cloth";

describe("clothColor", () => {
  it("has eight cloth colours", () => {
    expect(CLOTH_COLORS).toHaveLength(8);
  });

  it("gives the same title the same colour", () => {
    expect(clothColor("Dune")).toBe(clothColor("Dune"));
  });

  it("always returns a palette colour, even for odd titles", () => {
    expect(CLOTH_COLORS).toContain(clothColor("x".repeat(500)));
    expect(CLOTH_COLORS).toContain(clothColor(""));
    expect(CLOTH_COLORS).toContain(clothColor("Gödel, Escher, Bach"));
  });

  it("spreads titles across the palette", () => {
    const titles = Array.from({ length: 60 }, (_, i) => `Book number ${i}`);
    expect(new Set(titles.map(clothColor)).size).toBeGreaterThanOrEqual(6);
  });
});
