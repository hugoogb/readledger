export const MANGADEX_COVER_URL = /^https:\/\/uploads\.mangadex\.org\/covers\//;

export const OPENLIBRARY_COVER_URL = /^https:\/\/covers\.openlibrary\.org\/b\/id\/\d+-[SML]\.jpg$/;

export const GOOGLE_BOOKS_COVER_URL = /^https:\/\/books\.google\.com\/books\/content\?/;

export function isAllowedCoverUrl(url: string): boolean {
  return (
    MANGADEX_COVER_URL.test(url) || OPENLIBRARY_COVER_URL.test(url) || GOOGLE_BOOKS_COVER_URL.test(url)
  );
}
