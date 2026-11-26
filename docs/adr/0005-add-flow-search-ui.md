# 0005. Add-flow search UI

Status: accepted

### Independent sections per source

Where: `components/series/library-search.tsx` (`LibrarySearch`, `usePagedSearch`)

One search box queries MangaDex and Open Library, and each source has its own section with its own loading, empty and error state, so one failing source never hides the other. An ISBN query searches only Open Library. A section is remounted (via `key`) per query so its page resets to 1; `usePagedSearch` also keys each request on query, page and attempt, so a stale response is never shown for a newer request.

### Scanner loading and availability

Where: `components/series/library-search.tsx` (`IsbnScanner`, `canScan`), `components/series/isbn-scanner.tsx`

The zxing barcode decoder (about 125 KB gzipped) is loaded lazily, only when someone taps Scan. It is pure JS, so there is no WASM to host and nothing is fetched from a CDN at runtime, which keeps the CSP tight. The component renders only inside the client-only add modal, so `navigator` exists; without `navigator.mediaDevices` (old browsers, plain-http origins) there is no Scan button.

### The volume match card goes below the book row

Where: `components/series/library-search.tsx` (`VolumeMatchCard` placement in `LibrarySearch`)

The card is placed under the single book row so the row a thumb is aiming at doesn't move when the card appears or collapses.

### Server action errors are rethrown with a message

Where: `components/series/library-search.tsx` (`MangaResults`)

Server action errors arrive without a usable message in production, so a failed MangaDex search is rethrown with a fixed user-facing message.

### A mistyped ISBN is searched as text

Where: `lib/isbn.ts` (`parseIsbnQuery`)

Only a query that is wholly a valid ISBN-10 or ISBN-13 counts as an ISBN search. A number with a bad checksum falls through to an ordinary text query instead of an ISBN lookup that can never match.

### Open Library actions return results, not throws

Where: `actions/openlibrary.ts` (`searchBooks`, `getBookDetails`)

The Open Library actions return `ActionResult` values so the add modal can show an Open Library failure in the Books section without breaking the Manga section.

### Add flow lifecycle

Where: `components/series/add-book-provider.tsx` (`AddBookProvider`)

The sheet records the pathname it was opened on and is open only there, so a back swipe or any navigation closes it instead of leaving it over the next page. It is keyed per opening so each opening starts fresh. Publisher options are fetched on each opening and kept between openings, so the search order is already right when the sheet reopens; before the first load books show first with no publishers.

### Late descriptions are ignored

Where: `components/series/add-series-modal.tsx` (description fetch)

The description loads after the form opens and is applied only if the user is still on that book and has not typed their own, so a slow response never overwrites edits or lands on another book.

### MangaDex picks default to manga format

Where: `components/series/add-series-modal.tsx` (MangaDex selection handler)

Form values are set immediately on selection. MangaDex cannot distinguish light novels from manga, so the format defaults to manga and the user can change it in the form.

### Scanner always releases the camera stream

Where: `components/series/isbn-scanner.tsx` (effect cleanup, `stop`)

The component stops the media stream's tracks itself even when zxing never started, and stops immediately if it was closed while the permission prompt was up. Otherwise the camera stays on.
