// Covers render through next/image, which only fetches the hosts and paths
// listed in next.config.ts `images.remotePatterns`. Any other URL would crash
// the page that shows it, so stored covers are restricted to these shapes.

export const MANGADEX_COVER_URL = /^https:\/\/uploads\.mangadex\.org\/covers\//;

// Only cover-ID URLs: Open Library rate-limits ISBN/OCLC/LCCN-keyed cover URLs
// per IP, and next/image fetches every cover from our one server IP.
export const OPENLIBRARY_COVER_URL = /^https:\/\/covers\.openlibrary\.org\/b\/id\/\d+-[SML]\.jpg$/;

export function isAllowedCoverUrl(url: string): boolean {
  return MANGADEX_COVER_URL.test(url) || OPENLIBRARY_COVER_URL.test(url);
}
