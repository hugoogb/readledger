# 0002. External book APIs

Status: accepted

### Open Library terms of use

Where: `lib/openlibrary-api.ts` (`USER_AGENT`, `fetchJson`, `buildOpenLibraryCoverUrl`), `lib/rate-limit.ts` (`throttleOpenLibrary`)

Open Library's terms (checked 2026-11-19, https://openlibrary.org/developers/api) ask clients to identify the app in the User-Agent, cache responses, prefer `search.json` over many single-record requests, and stay within 3 requests/second when the User-Agent carries a contact email (1/s without one). The User-Agent includes `CONTACT_EMAIL`, so the throttle runs at one slot per 334 ms. Covers are referenced by cover ID only: ID URLs are not rate-limited, while ISBN- and OLID-keyed cover URLs are limited to 100 per 5 minutes per IP.

### ISBN lookups read the matched edition

Where: `lib/openlibrary-api.ts` (`ISBN_FIELDS`, `mapSearchDoc`, `BookSearchResult.editionTitle`), `services/isbn-volume.ts` (`resolveIsbnVolume`)

For an `isbn:` query, search.json's `editions` field holds the edition that matched. Its cover is preferred over the work's. Its title is kept as `editionTitle` but never shown, because it is often noisy ("… - 4. edición") or wrong; it is used only as a fallback source for a volume number when the work title has none.

### Open Library throttle errors bypass the generic API error

Where: `lib/openlibrary-api.ts` (`fetchJson`)

`throttleOpenLibrary()` is awaited outside the `try` so a busy throttle surfaces its own "Book search is busy" message instead of being turned into `OpenLibraryError`.

### Book details never fail the add form

Where: `lib/openlibrary-api.ts` (`getBookDetails`)

The description is fetched when the user picks a book and is optional: any failure returns `{ description: null }` so the form still opens. Merged works come back as `/type/redirect` stubs whose `location` names the surviving work, which is fetched instead.

### Google Books result keys

Where: `lib/openlibrary-api.ts` (`BookSearchResult.source`), `lib/googlebooks-api.ts`, `components/series/library-search.tsx` (`BookResults`)

A `BookSearchResult` with `source: "googlebooks"` carries a Google volume id in `key`, not an Open Library work key. Google Books only answers ISBN lookups, so a results page always comes from a single source.

### Throttle reserves its slot before waiting

Where: `lib/rate-limit.ts` (`createThrottle`)

Callers are given slots `intervalMs` apart, and the slot is reserved before awaiting, so concurrent callers can't all read the same last-request time and fire together. A caller whose slot is more than `maxWaitMs` away is rejected without reserving one rather than queueing indefinitely. One server IP serves every user, so each throttle is process-wide.

### Outbound rate limits per provider

Where: `lib/rate-limit.ts` (`throttleMangadex`, `throttleGoogleBooks`)

MangaDex asks for at most 5 requests/second per client, hence a 200 ms interval. Google Books is only an ISBN fallback (`lib/isbn-lookup.ts`), so 1 request/second is plenty.

### Rate-limit entries keep their longest window

Where: `lib/rate-limit.ts` (`RateLimitEntry.windowMs`, `checkRateLimit`)

Each key stores the longest window it has been checked with, and the periodic cleanup prunes by that window, so cleanup never cuts a long window short (for example the hourly OTP-send limit).

### MangaDex alt titles keep every language

Where: `lib/manga-api.ts` (`MangaSearchResult.altTitles`)

Alt titles are kept in every language because scan matching compares against them, and Spanish editions are matched by their Spanish names.

### TTLCache evicts the oldest-inserted entry

Where: `lib/cache.ts` (`TTLCache.set`)

The cache relies on Map insertion order: deleting then re-inserting a key makes it newest, and only a genuinely new key can push the cache past `maxSize`, evicting the oldest entry.

### Stored cover URLs are restricted to allowed shapes

Where: `lib/covers.ts` (`isAllowedCoverUrl`), `next.config.ts` (`images.remotePatterns`)

Covers render through next/image, which only fetches hosts and paths listed in `images.remotePatterns`; any other URL would crash the page that shows it. Stored covers are therefore limited to the MangaDex, Open Library cover-ID and Google Books shapes, and the two lists must change together.

### Google Books needs an API key and credit

Where: `lib/googlebooks-api.ts` (`lookupIsbnGoogle`)

Google Books is used only as an ISBN fallback when Open Library has no record, which is common for Spanish editions. It needs `GOOGLE_BOOKS_API_KEY` because the keyless quota is shared by every caller and usually exhausted, so without a key the fallback is skipped. Results must be credited to Google Books wherever they are shown.

### Google volumes without identifiers are accepted

Where: `lib/googlebooks-api.ts` (`listsIsbn`)

A Google Books volume is kept only if it lists the requested ISBN in either form, but a volume with no `industryIdentifiers` cannot be checked and is given the benefit of the doubt.

### Google Books failures are not cached

Where: `lib/googlebooks-api.ts` (`lookupIsbnGoogle`)

Successful lookups, including not-found results, are cached for 10 minutes, but errors are not, so a transient failure does not hide a book for the whole TTL.

### Concurrent ISBN lookups share one in-flight request

Where: `lib/isbn-lookup.ts` (`lookupIsbnAnySource`)

A scan triggers the book search and the volume resolver at the same time, so lookups for one ISBN share a single in-flight promise instead of each calling every source and spending throttle slots twice.

### Open Library outages surface only when no source has the book

Where: `lib/isbn-lookup.ts` (`lookupAll`)

An Open Library error does not stop the Google Books fallback. If no source finds the book, the original Open Library error is rethrown so an outage is reported rather than shown as 'not found'.

### Contact address is non-personal

Where: `lib/site.ts` (`CONTACT_EMAIL`)

`CONTACT_EMAIL` is a shared, non-personal address because it is sent publicly in the Open Library User-Agent. It is also the transactional sender, so it matches `EMAIL_FROM`.

### AniList is not a data source

Where: `scripts/refresh-manga-series.mjs`, `lib/manga-api.ts`

AniList's terms prohibit use in manga tracker services, so it must not be added as a source for series data.

### ISBN resolving and marking share one budget

Where: `actions/isbn-volume.ts` (`limit`)

Resolving a scanned ISBN can hit Open Library, Google Books and MangaDex, so resolving and marking draw from a single per-user rate limit.

### Provider proxy actions require a session

Where: `actions/mangadex.ts`, `actions/openlibrary.ts`

Server actions that proxy MangaDex or Open Library go through a process-wide throttle, so they require a session and bounded inputs to keep anonymous callers from tying it up.

### ISBN searches normalise to ISBN-13

Where: `actions/openlibrary.ts` (`searchBooks`)

An ISBN query is normalised to ISBN-13, the same key the volume resolver uses, so both paths share one lookup.

### Footer carries the data-source credits

Where: `components/marketing/site-footer.tsx` (`SiteFooter`)

MangaDex's API policy requires visible credit, Open Library asks for a courtesy link, and Google Books results must be attributed. The footer links to all three and must keep them.
