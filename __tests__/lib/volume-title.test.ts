import { describe, expect, it } from "vitest";
import { normalizeTitle, parseVolumeTitle } from "@/lib/volume-title";

describe("parseVolumeTitle", () => {
  it.each([
    ["Dr. Slump nº 11/15", "Dr. Slump", 11, 15, true],
    ["ONE PIECE 3", "ONE PIECE", 3, null, false],
    ["One Piece n.º 03", "One Piece", 3, null, true],
    ["Berserk Vol. 5", "Berserk", 5, null, true],
    ["Naruto, Volumen 12", "Naruto", 12, null, true],
    ["Monster Tomo 4", "Monster", 4, null, true],
    ["Chainsaw Man #7", "Chainsaw Man", 7, null, true],
    ["Bleach (Vol. 2)", "Bleach", 2, null, true],
    ["Guardianes de la noche 23", "Guardianes de la noche", 23, null, false],
  ] as const)("%s", (title, seriesTitle, volumeNumber, totalVolumes, marked) => {
    expect(parseVolumeTitle(title)).toEqual({ seriesTitle, volumeNumber, totalVolumes, marked });
  });

  it.each(["1984", "Cien años de soledad", "Vol. 3", "Saga 9999"])("null for %s", (t) => {
    expect(parseVolumeTitle(t)).toBeNull();
  });
});

describe("normalizeTitle", () => {
  it("strips case, accents and punctuation", () => {
    expect(normalizeTitle("  Dr. Slump: ¡Edición!  ")).toBe("dr slump edicion");
  });
});
