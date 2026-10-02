import { parseCsv } from "@/lib/csv";
import { Condition, SeriesStatus } from "@/lib/generated/prisma/enums";
import { MAX_VOLUMES } from "@/lib/validations";

export type ImportFormat = "csv" | "json";

export const MAX_IMPORT_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_IMPORT_ROWS = 10_000;

export type ImportRow = {
  seriesTitle: string;
  volumeNumber: number;
  owned: boolean;
  read: boolean;
  wishlist: boolean;
  pricePaid: number | null;
  store: string | null;
  condition: Condition | null;
  /** "YYYY-MM-DD" */
  purchaseDate: string | null;
  /** "YYYY-MM-DD" */
  readDate: string | null;
  notes: string | null;
  isbn: string | null;
  coverImage: string | null;
};

/** Series-level fields only present in JSON exports. */
export type ImportSeriesMeta = {
  author: string | null;
  status: SeriesStatus | null;
  publishing: boolean;
  totalVolumes: number | null;
  retailPrice: number | null;
  coverImage: string | null;
  description: string | null;
  mangadexId: string | null;
};

export type ImportPreview = {
  rows: ImportRow[];
  errors: { row: number; message: string }[];
  seriesCount: number;
  volumeCount: number;
  /** Keyed by series title. */
  seriesMeta: Record<string, ImportSeriesMeta>;
};

const MANGADEX_COVER_URL = /^https:\/\/uploads\.mangadex\.org\/covers\//;
const CONDITIONS = new Set<string>(Object.values(Condition));
const STATUSES = new Set<string>(Object.values(SeriesStatus));

const LIMITS = { title: 255, store: 100, notes: 1000, isbn: 32, author: 255, description: 2000 };

/** Thrown for a single bad cell; becomes a per-row preview error. */
class RowError extends Error {}

function text(value: unknown, field: keyof typeof LIMITS): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  if (s.length > LIMITS[field]) {
    throw new RowError(`${field} is longer than ${LIMITS[field]} characters`);
  }
  return s;
}

function volumeNumber(value: unknown): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > MAX_VOLUMES) {
    throw new RowError(`volume number must be a whole number from 1 to ${MAX_VOLUMES}`);
  }
  return n;
}

function price(value: unknown, field: string): number | null {
  if (value == null || value === "") return null;
  // Accept "7,95" as written by spreadsheets in comma-decimal locales.
  const n = typeof value === "number" ? value : Number(String(value).trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 100_000) {
    throw new RowError(`${field} must be a number of 0 or more`);
  }
  return Math.round(n * 100) / 100;
}

/** Accepts "YYYY-MM-DD" or the European "DD/MM/YYYY"; returns "YYYY-MM-DD". */
function date(value: unknown, field: string): string | null {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  let iso = s;
  const eu = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (eu) iso = `${eu[3]}-${eu[2].padStart(2, "0")}-${eu[1].padStart(2, "0")}`;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso) : null;
  if (!d || isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) {
    throw new RowError(`${field} must be a date like 2024-01-31`);
  }
  return iso;
}

function cover(value: unknown): string | null {
  if (typeof value !== "string" || !MANGADEX_COVER_URL.test(value)) return null;
  return value;
}

function condition(value: unknown): Condition | null {
  const s = value == null ? "" : String(value).trim().toUpperCase();
  return CONDITIONS.has(s) ? (s as Condition) : null;
}

const yes = (value: string) => ["yes", "true", "1"].includes(value.toLowerCase());

/**
 * The CSV export prefixes cells starting with = + - @ with an apostrophe so
 * spreadsheets don't run them as formulas; undo that on the way back in.
 */
function unescapeCell(value: string): string {
  return /^'[=+\-@\t\r]/.test(value) ? value.slice(1) : value;
}

function emptyPreview(message: string): ImportPreview {
  return { rows: [], errors: [{ row: 0, message }], seriesCount: 0, volumeCount: 0, seriesMeta: {} };
}

export function parseImport(data: string, format: ImportFormat): ImportPreview {
  const rows: ImportRow[] = [];
  const errors: { row: number; message: string }[] = [];
  const seriesMeta: Record<string, ImportSeriesMeta> = {};

  if (data.length > MAX_IMPORT_SIZE) {
    return emptyPreview("File too large. Maximum size is 5 MB.");
  }

  if (format === "json") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      return emptyPreview("Invalid JSON");
    }
    if (!Array.isArray(parsed)) return emptyPreview("Expected an array of series");

    for (let si = 0; si < parsed.length; si++) {
      const s = parsed[si] as Record<string, unknown>;
      let title: string | null;
      try {
        title = text(s?.title, "title");
      } catch (err) {
        errors.push({ row: si + 1, message: `Series ${si + 1}: ${(err as Error).message}` });
        continue;
      }
      if (!title) {
        errors.push({ row: si + 1, message: `Series ${si + 1}: missing title` });
        continue;
      }

      try {
        const totalVolumes = s.totalVolumes == null ? null : Number(s.totalVolumes);
        seriesMeta[title] = {
          author: text(s.author, "author"),
          status: STATUSES.has(String(s.status)) ? (s.status as SeriesStatus) : null,
          publishing: s.publishing === true,
          totalVolumes:
            totalVolumes != null && Number.isInteger(totalVolumes) && totalVolumes >= 0 && totalVolumes <= MAX_VOLUMES
              ? totalVolumes
              : null,
          retailPrice: price(s.retailPrice, "retailPrice"),
          coverImage: cover(s.coverImage),
          description: text(s.description, "description"),
          mangadexId: typeof s.mangadexId === "string" && s.mangadexId.length <= 64 ? s.mangadexId : null,
        };
      } catch (err) {
        errors.push({ row: si + 1, message: `${title}: ${(err as Error).message}` });
        continue;
      }

      if (!Array.isArray(s.volumes)) continue;

      for (const raw of s.volumes) {
        const v = (raw ?? {}) as Record<string, unknown>;
        try {
          rows.push({
            seriesTitle: title,
            volumeNumber: volumeNumber(v.volumeNumber),
            owned: v.owned === true,
            read: v.read === true,
            wishlist: v.wishlist === true,
            pricePaid: price(v.pricePaid, "pricePaid"),
            store: text(v.store, "store"),
            condition: condition(v.condition),
            purchaseDate: date(v.purchaseDate, "purchaseDate"),
            readDate: date(v.readDate, "readDate"),
            notes: text(v.notes, "notes"),
            isbn: text(v.isbn, "isbn"),
            coverImage: cover(v.coverImage),
          });
        } catch (err) {
          errors.push({
            row: si + 1,
            message: `${title}, volume ${String(v.volumeNumber ?? "?")}: ${(err as Error).message}`,
          });
        }
      }
    }
  } else {
    const { headers, rows: csvRows } = parseCsv(data);

    const headerMap = new Map<string, number>();
    headers.forEach((h, i) => headerMap.set(h.trim().toLowerCase(), i));

    const getCol = (row: string[], name: string) => {
      const idx = headerMap.get(name);
      return idx !== undefined ? unescapeCell(row[idx]?.trim() || "") : "";
    };

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const line = i + 2; // 1-based, after the header row
      try {
        const title = text(getCol(row, "series_title"), "title");
        if (!title) throw new RowError("missing series_title");

        rows.push({
          seriesTitle: title,
          volumeNumber: volumeNumber(getCol(row, "volume_number") || NaN),
          owned: yes(getCol(row, "owned")),
          read: yes(getCol(row, "read")),
          wishlist: yes(getCol(row, "wishlist")),
          pricePaid: price(getCol(row, "price_paid"), "price_paid"),
          store: text(getCol(row, "store"), "store"),
          condition: condition(getCol(row, "condition")),
          purchaseDate: date(getCol(row, "purchase_date"), "purchase_date"),
          readDate: date(getCol(row, "read_date"), "read_date"),
          notes: text(getCol(row, "notes"), "notes"),
          isbn: text(getCol(row, "isbn"), "isbn"),
          coverImage: null,
        });
      } catch (err) {
        errors.push({ row: line, message: (err as Error).message });
      }
    }
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    return emptyPreview(`Too many rows. Maximum is ${MAX_IMPORT_ROWS}.`);
  }

  return {
    rows,
    errors,
    seriesCount: new Set(rows.map((r) => r.seriesTitle)).size,
    volumeCount: rows.length,
    seriesMeta,
  };
}
