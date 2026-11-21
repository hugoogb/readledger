// One ISBN lookup over every book source: Open Library first, Google Books
// only when Open Library has no record (or is down). Server-only.

import { lookupIsbnGoogle } from "./googlebooks-api";
import { lookupIsbn, type BookSearchResult } from "./openlibrary-api";

// A scan triggers the book search and the volume resolver at once; both
// share one in-flight lookup instead of each calling every source.
const inFlight = new Map<string, Promise<BookSearchResult | null>>();

/** The book for a normalised ISBN, or null when no source knows it. */
export function lookupIsbnAnySource(isbn: string): Promise<BookSearchResult | null> {
  const pending = inFlight.get(isbn);
  if (pending) return pending;
  const lookup = lookupAll(isbn).finally(() => inFlight.delete(isbn));
  inFlight.set(isbn, lookup);
  return lookup;
}

async function lookupAll(isbn: string): Promise<BookSearchResult | null> {
  let openLibraryError: unknown = null;
  try {
    const book = await lookupIsbn(isbn);
    if (book) return book;
  } catch (error) {
    openLibraryError = error;
  }

  const book = await lookupIsbnGoogle(isbn);
  if (book) return book;
  // Nothing found anywhere: an Open Library outage is still worth reporting.
  if (openLibraryError) throw openLibraryError;
  return null;
}
