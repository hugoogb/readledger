import { describe, expect, it } from "vitest";
import { withScannedVolume } from "@/lib/scanned-volume";

const scanned = { volumeNumber: 3, isbn: "9788468471549" };

describe("withScannedVolume", () => {
  it("marks the scanned volume owned with its ISBN", () => {
    const result = withScannedVolume([{ volumeNumber: 1 }, { volumeNumber: 2 }, { volumeNumber: 3 }], 3, scanned);
    expect(result.totalVolumes).toBe(3);
    expect(result.volumes[2]).toEqual({ volumeNumber: 3, owned: true, isbn: "9788468471549" });
    expect(result.volumes[0]).toEqual({ volumeNumber: 1 });
  });

  it("raises the total and fills the gap when the scan is past the end", () => {
    const result = withScannedVolume([{ volumeNumber: 1 }], 1, { volumeNumber: 4, isbn: "x" });
    expect(result.totalVolumes).toBe(4);
    expect(result.volumes.map((v) => v.volumeNumber)).toEqual([1, 2, 3, 4]);
    expect(result.volumes[3]).toMatchObject({ owned: true, isbn: "x" });
  });

  it("creates rows up to the scan when there were none", () => {
    const result = withScannedVolume([], null, scanned);
    expect(result.totalVolumes).toBe(3);
    expect(result.volumes.map((v) => v.volumeNumber)).toEqual([1, 2, 3]);
  });
});
