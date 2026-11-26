import { lookupIsbnGoogle } from "./googlebooks-api";
import { lookupIsbn, type BookSearchResult } from "./openlibrary-api";

const inFlight = new Map<string, Promise<BookSearchResult | null>>();

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
  if (openLibraryError) throw openLibraryError;
  return null;
}
