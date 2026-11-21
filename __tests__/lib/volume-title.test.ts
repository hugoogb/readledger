import { describe, expect, it } from "vitest";
import { normalizeTitle, parseVolumeTitle } from "@/lib/volume-title";

describe("parseVolumeTitle", () => {
  it.each([
    ["Dr. Slump nº 11/15", "Dr. Slump", 11, 15],
    ["ONE PIECE 3", "ONE PIECE", 3, null],
    ["One Piece n.º 03", "One Piece", 3, null],
    ["Berserk Vol. 5", "Berserk", 5, null],
    ["Naruto, Volumen 12", "Naruto", 12, null],
    ["Monster Tomo 4", "Monster", 4, null],
    ["Chainsaw Man #7", "Chainsaw Man", 7, null],
    ["Bleach (Vol. 2)", "Bleach", 2, null],
    ["Gantz N° 5", "Gantz", 5, null],
    ["Héroe Fugitivo no 04", "Héroe Fugitivo", 4, null],
    ["Kaiju No. 8 nº 3", "Kaiju No. 8", 3, null],
    ["Guardianes de la noche 23", "Guardianes de la noche", 23, null],
  ] as const)("%s", (title, seriesTitle, volumeNumber, totalVolumes) => {
    expect(parseVolumeTitle(title)).toEqual({ seriesTitle, volumeNumber, totalVolumes });
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
