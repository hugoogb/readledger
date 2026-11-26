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
const ISBN_FIELDS = [...SEARCH_FIELDS, "editions", "editions.key", "editions.cover_i", "editions.title"];

export type BookFormatGuess = "NOVEL" | "COMIC";

export type BookSearchResult = {
  key: string;
  title: string;
  authors: string[];
  year: number | null;
  coverImage: string;
  coverImageSmall: string;
  pages: number | null;
  subjects: string[];
  isbn: string | null;
  formatGuess: BookFormatGuess;
  editionTitle: string | null;
  source: "openlibrary" | "googlebooks";
};

export type BookSearchPage = {
  data: BookSearchResult[];
  pagination: { currentPage: number; hasNextPage: boolean };
};

export class OpenLibraryError extends AppError {
  constructor() {
    super("Open Library is unavailable right now. Please try again later.");
  }
}

const positiveInt = (v: unknown): number | null =>
  typeof v === "number" && Number.isInteger(v) && v > 0 ? v : null;

export function buildOpenLibraryCoverUrl(coverId: unknown, size: "S" | "M" | "L"): string {
  const id = positiveInt(coverId);
  return id === null ? "" : `${OPENLIBRARY_COVERS_URL}/b/id/${id}-${size}.jpg`;
}

export function parseWorkKey(key: unknown): string | null {
  if (typeof key !== "string") return null;
  const match = /^(?:\/works\/)?(OL\d+W)$/.exec(key);
  return match ? match[1] : null;
}

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

export function mapSearchDoc(doc: unknown, isbn?: string): BookSearchResult | null {
  if (!isRecord(doc)) return null;
  const key = parseWorkKey(doc.key);
  const title = typeof doc.title === "string" ? doc.title.trim() : "";
  if (!key || !title) return null;

  const editions = isRecord(doc.editions) && Array.isArray(doc.editions.docs) ? doc.editions.docs : [];
  const edition = isRecord(editions[0]) ? editions[0] : null;
  const editionCover = edition ? positiveInt(edition.cover_i) : null;
  const editionTitle = edition && typeof edition.title === "string" ? edition.title.trim() : "";
  const coverId = editionCover ?? doc.cover_i;
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

async function fetchJson(path: string): Promise<unknown> {
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

export async function lookupIsbn(isbn: string): Promise<BookSearchResult | null> {
  const cached = isbnCache.get(isbn);
  if (cached !== undefined) return cached;

  const raw = await fetchJson(searchPath(`isbn:${isbn}`, 1, ISBN_FIELDS));
  const result = mapSearchDoc(docsOf(raw)[0], isbn);
  isbnCache.set(isbn, result);
  return result;
}

export async function getBookDetails(workKey: string): Promise<{ description: string | null }> {
  const cached = detailsCache.get(workKey);
  if (cached) return cached;

  try {
    let work = await fetchJson(`/works/${workKey}.json`);
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
