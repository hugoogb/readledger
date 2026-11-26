# 0010. SEO and marketing pages

Status: accepted

### Guide updated date feeds the sitemap

Where: `content/guides/index.ts` (`Guide.updated`)

A guide's `updated` date is published as the sitemap's lastmod, so it changes only when the content really changes. Bumping it for cosmetic edits tells crawlers that pages changed when they did not.

### Public manga checklist data is a committed snapshot

Where: `lib/content/manga-series.ts` (`MangaSeries`), `scripts/refresh-manga-series.mjs`

The hand-picked series behind the public checklist pages use volume counts from a committed MangaDex snapshot, refreshed by `scripts/refresh-manga-series.mjs`, so pages render without calling MangaDex. The `note` field is written by hand and survives refreshes.

### Inexact volume counts mean at least

Where: `lib/content/manga-series.ts` (`MangaSeries.exact`)

`exact: false` means the volume count is a lower bound because the series may have more volumes. Display adds a trailing `+` and cost tables must not present the total as final.

### Related series links rotate from the current series

Where: `lib/content/manga-series.ts` (`relatedSeries`)

The candidate list is rotated to start at the current series' position so internal link equity spreads across all pages instead of always pointing at the alphabetically first titles.

### Content pages set Open Graph and Twitter in full

Where: `lib/content/metadata.ts` (`contentMetadata`)

A child route's `openGraph` replaces the root layout's instead of merging. Content pages therefore set Open Graph and Twitter completely, otherwise they would inherit the home page's URL or lose the image.

### Manga series counts are refreshed conservatively

Where: `scripts/refresh-manga-series.mjs`, `lib/content/manga-series.json`

MangaDex is community-maintained, so the refresh output is reviewed as a diff before committing. A completed series with a set `lastVolume` gets an exact count; anything else gets the highest numbered volume shown as 'at least N', and a lower number never replaces a higher one because aggregate data has gaps. Raised counts for running series are checked against Wikipedia or the publisher, and Witch Hat Atelier and Vagabond were left out because their MangaDex counts looked too high and could not be confirmed.

### Manga pages lead with a quotable answer

Where: `app/(public)/manga/[slug]/page.tsx` (`volumeAnswer`)

Each manga checklist page states the volume count in one plain sentence so search engines can quote it for "how many volumes" queries.

### Manga page titles drop subtitles

Where: `app/(public)/manga/[slug]/page.tsx` (`generateMetadata`)

The metadata title uses the series name before the first colon so search results don't truncate it.

### Favicon needs a square PNG

Where: `app/layout.tsx` (`metadata.icons`)

Google's search-result favicon requires a square PNG whose size is a multiple of 48px, so `icon-192.png` is listed next to the SVG icon.

### OG image is prerendered

Where: `app/opengraph-image.tsx`

The image route reads fonts and files from disk and is prerendered at build time, so those reads never run on the production server.

### Canonical URL only on the home page

Where: `app/page.tsx` (`metadata`)

`alternates.canonical: "/"` is declared on the home page only, because set in the root layout it would be inherited by every route and point them all at the home page.

### FAQ is visible text without FAQPage schema

Where: `app/page.tsx` (`faqs`)

Each FAQ answer is rendered as visible text, not only markup, and targets a question collectors search for. No FAQPage structured data is emitted because Google limits that rich result to government and health sites.

### FAQ uses native details elements

Where: `app/page.tsx` (FAQ section)

The FAQ uses native `<details>` so the answers stay in the server-rendered HTML for crawlers and need no client JavaScript.

### /login is not disallowed in robots.txt

Where: `app/robots.ts`

`/login` is left crawlable because a disallow would stop crawlers from reading its noindex tag, which is how it is kept out of search results.

### Sitemap dates come from content

Where: `app/sitemap.ts`

The sitemap lists indexable pages only. `lastModified` comes from content dates, never from the build time, because search engines learn to ignore dates that change on every deploy.

### JSON-LD output escapes <

Where: `components/marketing/content-parts.tsx` (`JsonLd`)

The JSON-LD payload is serialised with `<` replaced by `\u003c` before going into `dangerouslySetInnerHTML`, so no string value can close the script tag. This stays even though the data is static.

### Wide tables scroll in their own box

Where: `components/marketing/content-parts.tsx` (table wrapper)

Tables sit in a horizontally scrolling container so a wide table never widens the page on phones.
