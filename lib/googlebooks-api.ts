// Google Books API, used only as an ISBN fallback when Open Library has no
// record (common for Spanish editions). Documentation:
// https://developers.google.com/books/docs/v1/using
//
// Needs GOOGLE_BOOKS_API_KEY: the keyless quota is shared by every caller and
// is usually exhausted. Without a key the fallback is skipped. Results must be
// credited to Google Books where they are shown.

import { TTLCache } from "./cache";
import { isRecord, stringArray } from "./json";
import { toStoredIsbn } from "./isbn";
import { logger } from "./logger";
import { errorMessage } from "./utils";
import { guessFormat, type BookSearchResult } from "./openlibrary-api";
import { throttleGoogleBooks } from "./rate-limit";

const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes";
const GOOGLE_BOOKS_TIMEOUT_MS = 10_000;

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** The thumbnail over https, without the page-curl effect; "" when absent. */
function coverUrl(volumeInfo: Record<string, unknown>): string {
  const links = isRecord(volumeInfo.imageLinks) ? volumeInfo.imageLinks : {};
  const thumb = str(links.thumbnail);
  if (!thumb) return "";
  return thumb.replace(/^http:/, "https:").replace(/&edge=curl/, "");
}

/**
 * Whether the volume lists `isbn` (either form). A volume without identifiers
 * can't be checked and is given the benefit of the doubt.
 */
function listsIsbn(info: Record<string, unknown>, isbn: string): boolean {
  if (!Array.isArray(info.industryIdentifiers)) return true;
  const wanted = toStoredIsbn(isbn);
  return info.industryIdentifiers.some((id) => isRecord(id) && toStoredIsbn(str(id.identifier)) === wanted);
}

/** Map one `items[]` entry; null when it lacks an id or title, or is another book. */
export function mapGoogleVolume(item: unknown, isbn: string): BookSearchResult | null {
  if (!isRecord(item) || !isRecord(item.volumeInfo)) return null;
  const info = item.volumeInfo;
  const id = str(item.id);
  const baseTitle = str(info.title);
  if (!id || !baseTitle || !listsIsbn(info, isbn)) return null;

  const subtitle = str(info.subtitle);
  const year = /^(\d{4})/.exec(str(info.publishedDate));
  const pages = typeof info.pageCount === "number" && info.pageCount > 0 ? info.pageCount : null;
  const categories = stringArray(info.categories);
  const cover = coverUrl(info);

  return {
    key: id,
    title: subtitle ? `${baseTitle}: ${subtitle}` : baseTitle,
    authors: stringArray(info.authors),
    year: year ? Number(year[1]) : null,
    coverImage: cover,
    coverImageSmall: cover,
    pages,
    subjects: categories,
    isbn,
    formatGuess: guessFormat(categories),
    source: "googlebooks",
    editionTitle: null,
  };
}

const isbnCache = new TTLCache<BookSearchResult | null>(10 * 60_000, 200);

/** The book for a normalised ISBN, or null (also when unconfigured or unreachable). */
export async function lookupIsbnGoogle(isbn: string): Promise<BookSearchResult | null> {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  if (!key) return null;

  const cached = isbnCache.get(isbn);
  if (cached !== undefined) return cached;

  try {
    await throttleGoogleBooks();
    const params = new URLSearchParams({ q: `isbn:${isbn}`, key });
    const res = await fetch(`${GOOGLE_BOOKS_URL}?${params}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(GOOGLE_BOOKS_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Google Books API error: ${res.status}`);
    const raw: unknown = await res.json();
    const items = isRecord(raw) && Array.isArray(raw.items) ? raw.items : [];
    const result = mapGoogleVolume(items[0], isbn);
    isbnCache.set(isbn, result);
    return result;
  } catch (error) {
    // Not cached: a transient failure shouldn't hide the book for 10 minutes.
    logger.error("Error fetching from Google Books", {
      error: errorMessage(error),
    });
    return null;
  }
}
