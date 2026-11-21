// One ISBN lookup over every book source: Open Library first, Google Books
// only when Open Library has no record (or is down). Server-only.

import { lookupIsbnGoogle } from "./googlebooks-api";
import { lookupIsbn, type BookSearchResult } from "./openlibrary-api";

/** The book for a normalised ISBN, or null when no source knows it. */
export async function lookupIsbnAnySource(isbn: string): Promise<BookSearchResult | null> {
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
