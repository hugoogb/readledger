// Applies a scanned volume to the volume rows of a series being created. Pure.

import type { VolumeInput } from "@/services/series";

/**
 * Marks the scanned volume owned with its ISBN. A scan past the end (stale
 * MangaDex count, a new release) raises the total and fills the gap, so the
 * series stays numbered 1..total like any other.
 */
export function withScannedVolume(
  volumes: VolumeInput[],
  totalVolumes: number | null,
  scanned: { volumeNumber: number; isbn: string },
): { volumes: VolumeInput[]; totalVolumes: number } {
  const total = Math.max(totalVolumes ?? 0, scanned.volumeNumber);
  const byNumber = new Map(volumes.map((v) => [v.volumeNumber, v]));
  for (let n = 1; n <= total; n++) if (!byNumber.has(n)) byNumber.set(n, { volumeNumber: n });
  const owned = { ...byNumber.get(scanned.volumeNumber)!, owned: true, isbn: scanned.isbn };
  byNumber.set(scanned.volumeNumber, owned);
  return {
    volumes: [...byNumber.values()].sort((a, b) => a.volumeNumber - b.volumeNumber),
    totalVolumes: total,
  };
}
