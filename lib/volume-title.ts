// Splits an edition title ("Dr. Slump nº 11/15") into its series name and
// volume number, so a scanned volume can be matched to a series. Pure.

import { MAX_VOLUMES } from "./validations";

export type ParsedVolumeTitle = {
  seriesTitle: string;
  volumeNumber: number;
  /** The edition's own total when printed ("11/15"), else null. */
  totalVolumes: number | null;
  /** A volume marker (nº, vol., tomo, #, N/M) was present; false for a bare trailing number. */
  marked: boolean;
};

// "nº 11", "n.º 03", "N° 5" (degree sign), "no. 4", "vol. 5", "volumen 12", "volume 3", "tomo 4", "#7",
// optionally followed by "/15" and a closing parenthesis.
const MARKED = /^(.*?)\s*(?:n\.?\s?[º°]|no\.|vol(?:umen|ume|\.)?|tomo|#)\s*(\d+)(?:\s*\/\s*(\d+))?\s*\)?\s*$/i;
// "Dr. Slump 11/15": a printed total marks it as a volume too.
const WITH_TOTAL = /^(.*?)\s+(\d+)\s*\/\s*(\d+)\s*$/;
// "ONE PIECE 3": weak evidence, needs a series match to count (see resolver).
const BARE = /^(.*?)[\s,]+(\d+)\s*$/;

const cleanSeries = (s: string) => s.replace(/[\s,:\-(]+$/, "").trim();

export function parseVolumeTitle(title: string): ParsedVolumeTitle | null {
  const t = title.trim();
  const m = MARKED.exec(t) ?? WITH_TOTAL.exec(t);
  const match = m ?? BARE.exec(t);
  if (!match) return null;

  const seriesTitle = cleanSeries(match[1]);
  const volumeNumber = Number(match[2]);
  const total = match[3] ? Number(match[3]) : null;
  if (!seriesTitle || volumeNumber < 1 || volumeNumber > MAX_VOLUMES) return null;

  return {
    seriesTitle,
    volumeNumber,
    totalVolumes: total !== null && total >= volumeNumber && total <= MAX_VOLUMES ? total : null,
    marked: m !== null,
  };
}

/** Lowercase, accents stripped, punctuation collapsed to single spaces. */
export function normalizeTitle(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
