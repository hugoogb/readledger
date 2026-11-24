// Open Library API
// Documentation: https://openlibrary.org/developers/api
//
// Terms (checked 2026-11-19): identify the app in the User-Agent, cache
// responses, use search.json rather than many single-record requests, and
// stay within 3 requests/second, the limit for clients whose User-Agent
// carries a contact email (1/s without one). Covers are referenced by cover ID only: ID URLs are not
// rate-limited, ISBN/OLID-keyed ones are (100 per 5 minutes per IP).

import { TTLCache } from "./cache";
import { isRecord, stringArray } from "./json";
import { AppError } from "./errors";
import { logger } from "./logger";
import { errorMessage } from "./utils";
import { throttleOpenLibrary } from "./rate-limit";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "./site";

const OPENLIBRARY_BASE_URL = "https://openlibrary.org";
const OPENLIBRARY_COVERS_URL = "https://covers.openlibrary.org";
const OPENLIBRARY_TIMEOUT_MS = 10_000;
const USER_AGENT = `${SITE_NAME} (${SITE_URL}; ${CONTACT_EMAIL})`;
const PAGE_SIZE = 10;
const MAX_SUBJECTS = 10;
const MAX_DESCRIPTION = 2000;

const SEARCH_FIELDS = [
  "key",
  "title",
  "author_name",
  "first_publish_year",
  "cover_i",
  "number_of_pages_median",
  "subject",
];
// For an isbn: query, `editions` holds the edition that matched.
// Its title can carry a volume number the work title lacks (see editionTitle).
const ISBN_FIELDS = [...SEARCH_FIELDS, "editions", "editions.key", "editions.cover_i", "editions.title"];

// --- Normalized app types ---

/** Format suggested for a book result; the user can change it in the form. */
export type BookFormatGuess = "NOVEL" | "COMIC";

export type BookSearchResult = {
  /** Work key without the /works/ prefix, e.g. "OL893414W". */
  key: string;
  title: string;
  authors: string[];
  year: number | null;
  /** Large cover-ID URL, or "" when the work has no cover. */
  coverImage: string;
  /** Medium cover-ID URL, or "". */
  coverImageSmall: string;
  pages: number | null;
  subjects: string[];
  /** Set only when the result came from an ISBN lookup. */
  isbn: string | null;
  formatGuess: BookFormatGuess;
  /**
   * The matched edition's own title (ISBN lookups only). Not shown: it's often
   * noisy ("… - 4. edición") or wrong, but it can carry a volume number.
   */
  editionTitle: string | null;
  /** Where the result came from; `key` is a Google volume id for "googlebooks". */
  source: "openlibrary" | "googlebooks";
};

export type BookSearchPage = {
  data: BookSearchResult[];
  pagination: { currentPage: number; hasNextPage: boolean };
};

export class OpenLibraryError extends AppError {
  constructor() {
    super("Open Library is unavailable right now. Please try again later.", "UPSTREAM_ERROR", 502);
  }
}

// --- Pure helpers ---

const positiveInt = (v: unknown): number | null =>
  typeof v === "number" && Number.isInteger(v) && v > 0 ? v : null;

/** Cover-ID URL for `coverId`, or "" when it isn't a positive integer. */
export function buildOpenLibraryCoverUrl(coverId: unknown, size: "S" | "M" | "L"): string {
  const id = positiveInt(coverId);
  return id === null ? "" : `${OPENLIBRARY_COVERS_URL}/b/id/${id}-${size}.jpg`;
}

/** "/works/OL1W" or "OL1W" → "OL1W"; anything else → null. */
export function parseWorkKey(key: unknown): string | null {
  if (typeof key !== "string") return null;
  const match = /^(?:\/works\/)?(OL\d+W)$/.exec(key);
  return match ? match[1] : null;
}

/** A work's description, which Open Library stores as a string or {type, value}. */
export function extractDescription(work: unknown): string | null {
  if (!isRecord(work)) return null;
  const raw = isRecord(work.description) ? work.description.value : work.description;
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  return text ? text.slice(0, MAX_DESCRIPTION) : null;
}

const COMIC_SUBJECT = /comic|graphic novel|bandes? dessin/i;

export function guessFormat(subjects: string[]): BookFormatGuess {
  return subjects.some((s) => COMIC_SUBJECT.test(s)) ? "COMIC" : "NOVEL";
}

/** Map one search.json doc; null when it lacks a work key or title. */
export function mapSearchDoc(doc: unknown, isbn?: string): BookSearchResult | null {
  if (!isRecord(doc)) return null;
  const key = parseWorkKey(doc.key);
  const title = typeof doc.title === "string" ? doc.title.trim() : "";
  if (!key || !title) return null;

  // An ISBN lookup prefers the matched edition's cover over the work's.
  const editions = isRecord(doc.editions) && Array.isArray(doc.editions.docs) ? doc.editions.docs : [];
  const edition = isRecord(editions[0]) ? editions[0] : null;
  const editionCover = edition ? positiveInt(edition.cover_i) : null;
  const editionTitle = edition && typeof edition.title === "string" ? edition.title.trim() : "";
  const coverId = editionCover ?? doc.cover_i;
  // `subject` is the full list for a work (often hundreds); keep a few.
  const subjects = stringArray(doc.subject);

  return {
    key,
    title,
    authors: stringArray(doc.author_name),
    year: positiveInt(doc.first_publish_year),
    coverImage: buildOpenLibraryCoverUrl(coverId, "L"),
    coverImageSmall: buildOpenLibraryCoverUrl(coverId, "M"),
    pages: positiveInt(doc.number_of_pages_median),
    subjects: subjects.slice(0, MAX_SUBJECTS),
    isbn: isbn ?? null,
    formatGuess: guessFormat(subjects),
    source: "openlibrary",
    editionTitle: editionTitle || null,
  };
}

// --- Network ---

async function fetchJson(path: string): Promise<unknown> {
  // Outside the try: a busy throttle is its own user-facing error.
  await throttleOpenLibrary();
  try {
    const res = await fetch(`${OPENLIBRARY_BASE_URL}${path}`, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(OPENLIBRARY_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Open Library API error: ${res.status}`);
    return await res.json();
  } catch (error) {
    logger.error("Error fetching from Open Library", {
      path: path.split("?")[0],
      error: errorMessage(error),
    });
    throw new OpenLibraryError();
  }
}

function searchPath(q: string, page: number, fields: string[]): string {
  const params = new URLSearchParams({
    q,
    page: String(page),
    limit: String(PAGE_SIZE),
    fields: fields.join(","),
  });
  return `/search.json?${params}`;
}

const docsOf = (raw: unknown): unknown[] =>
  isRecord(raw) && Array.isArray(raw.docs) ? raw.docs : [];

// Book metadata barely changes, so cache longer than MangaDex's 1 minute.
const searchCache = new TTLCache<BookSearchPage>(10 * 60_000, 200);
const isbnCache = new TTLCache<BookSearchResult | null>(10 * 60_000, 200);
const detailsCache = new TTLCache<{ description: string | null }>(60 * 60_000, 200);

export async function searchBooks(query: string, page: number): Promise<BookSearchPage> {
  const q = query.trim().toLowerCase();
  const cacheKey = `${q}:${page}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const raw = await fetchJson(searchPath(q, page, SEARCH_FIELDS));
  const numFound = isRecord(raw) && typeof raw.numFound === "number" ? raw.numFound : 0;
  const result: BookSearchPage = {
    data: docsOf(raw)
      .map((doc) => mapSearchDoc(doc))
      .filter((b): b is BookSearchResult => b !== null),
    pagination: { currentPage: page, hasNextPage: page * PAGE_SIZE < numFound },
  };
  searchCache.set(cacheKey, result);
  return result;
}

/** The work for a normalised ISBN-10/13, carrying that ISBN; null if unknown. */
export async function lookupIsbn(isbn: string): Promise<BookSearchResult | null> {
  const cached = isbnCache.get(isbn);
  if (cached !== undefined) return cached;

  const raw = await fetchJson(searchPath(`isbn:${isbn}`, 1, ISBN_FIELDS));
  const result = mapSearchDoc(docsOf(raw)[0], isbn);
  isbnCache.set(isbn, result);
  return result;
}

/**
 * Extra metadata fetched when the user picks a book. Never throws: the form
 * just opens without a description when Open Library can't be reached.
 */
export async function getBookDetails(workKey: string): Promise<{ description: string | null }> {
  const cached = detailsCache.get(workKey);
  if (cached) return cached;

  try {
    let work = await fetchJson(`/works/${workKey}.json`);
    // Merged works are left behind as redirect stubs.
    if (isRecord(work) && isRecord(work.type) && work.type.key === "/type/redirect") {
      const target = parseWorkKey(work.location);
      work = target ? await fetchJson(`/works/${target}.json`) : null;
    }
    const result = { description: extractDescription(work) };
    detailsCache.set(workKey, result);
    return result;
  } catch {
    return { description: null };
  }
}
