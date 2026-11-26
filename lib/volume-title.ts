import { MAX_VOLUMES } from "./validations";

export type ParsedVolumeTitle = {
  seriesTitle: string;
  volumeNumber: number;
  totalVolumes: number | null;
};

const MARKED = /^(.*?)\s*(?:n\.?\s?[º°]|no\.?(?=\s)|vol(?:umen|ume|\.)?|tomo|#)\s*(\d+)(?:\s*\/\s*(\d+))?\s*\)?\s*$/i;
const WITH_TOTAL = /^(.*?)\s+(\d+)\s*\/\s*(\d+)\s*$/;
const BARE = /^(.*?)[\s,]+(\d+)\s*$/;

const cleanSeries = (s: string) => s.replace(/[\s,:\-(]+$/, "").trim();

export function parseVolumeTitle(title: string): ParsedVolumeTitle | null {
  const t = title.trim();
  const match = MARKED.exec(t) ?? WITH_TOTAL.exec(t) ?? BARE.exec(t);
  if (!match) return null;

  const seriesTitle = cleanSeries(match[1]);
  const volumeNumber = Number(match[2]);
  const total = match[3] ? Number(match[3]) : null;
  if (!seriesTitle || volumeNumber < 1 || volumeNumber > MAX_VOLUMES) return null;

  return {
    seriesTitle,
    volumeNumber,
    totalVolumes: total !== null && total >= volumeNumber && total <= MAX_VOLUMES ? total : null,
  };
}

export function normalizeTitle(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
