# 0003. Library model

Status: accepted

### A Series row is a title

Where: `lib/format.ts` (`isStandalone`)

In code a `Series` row is a "title": either a standalone book or a series of volumes. A title is standalone when its total is exactly 1 and it has at most one volume row. A title with several rows renders as a series so no data is hidden, and an unknown total (null) is an ongoing series that has just started.

### Standalone status follows the read flag

Where: `lib/format.ts` (`standaloneStatusAfterRead`), `services/volumes.ts` (`syncStandaloneStatus`, `bulkSetRead`)

Reading a standalone book completes it; un-reading only reopens a book that was completed. Series are never touched. The sync runs inside the caller's transaction so every read change gets it, and bulk updates sync only the volumes the update actually marks read.

### Owning a volume clears its wishlist flag

Where: `services/volumes.ts` (`updateVolume`, `bulkMarkOwned`)

Marking a volume owned sets `wishlist: false`, so removing it from the collection later doesn't bring back the wish.

### readDate tracks the read flag

Where: `services/volumes.ts` (`resolveReadDate`, `toggleVolumeRead`)

Unread volumes have no `readDate`, and a read volume always has one: an explicit date wins, then the stored date, then today. "Today" is the client's local calendar date (`YYYY-MM-DD`) because the server runs in UTC and would otherwise date late-night reads to the previous day.

### Bulk volume actions check ownership of every id

Where: `services/volumes.ts` (`findOwnedVolumes`)

Bulk actions throw unless every requested id belongs to one of the user's volumes; a partial match is rejected rather than silently applied to the subset.

### A scanned ISBN belongs to one volume

Where: `services/isbn-volume.ts` (`markVolumeOwnedByIsbn`), `lib/scanned-volume.ts` (`withScannedVolume`)

Filing a scan marks the volume owned and stores the ISBN on it, clearing that ISBN from any other volume of the same user. A volume number past the series total creates the missing rows in between, so rows 1..total stay contiguous, as raising the total in the edit form does. A scan past the end of a series being added (a stale MangaDex count, a new release) raises its total the same way.

### Scan resolution only suggests

Where: `services/isbn-volume.ts` (`resolveIsbnVolume`, `VolumeMatch`)

A scanned ISBN resolves to a volume the user already has, a volume of one of their series, or a volume of a MangaDex series they don't have yet; null means it looks like a plain book. Nothing is written until the user confirms through `markVolumeOwnedByIsbn`. The work title is parsed before the edition title. The edition's printed total wins over MangaDex's (kanzenban, 3-in-1 editions), and when the two differ `useMangadexCovers` is false because MangaDex's covers would show other books.

### CSV export neutralises formula injection

Where: `lib/csv.ts` (`serializeCsv`), `lib/import.ts` (`unescapeCell`)

Fields starting with `=`, `+`, `-`, `@`, tab or carriage return are prefixed with a single quote so spreadsheet applications do not execute user-entered titles or notes as formulas. Import strips that apostrophe so an export re-imports unchanged.

### Import format defaults to manga

Where: `lib/import.ts` (`ImportPreview.formats`, `noteFormat`)

A title's format is absent when the file does not state one, and new titles are then created as MANGA because every export made before formats existed was manga. The first non-empty format seen for a title wins and later conflicting values are ignored.

### Import accepts comma decimals and European dates

Where: `lib/import.ts` (`price`, `date`)

Prices written with a decimal comma ("7,95") and dates as DD/MM/YYYY are accepted because spreadsheets in European locales export them that way. Dates are validated by round-tripping through ISO so impossible dates like 31 February are rejected.

### Scanned barcodes must be Bookland EAN-13

Where: `lib/isbn.ts` (`isbnFromBarcode`)

ISBNs are the EAN-13 'Bookland' range, prefix 978 or 979, so a scanned barcode with any other prefix is rejected as not a book even if its checksum is valid.

### ISBNs are stored as bare ISBN-13

Where: `lib/isbn.ts` (`toStoredIsbn`, `isbnVariants`)

A valid ISBN-10 or ISBN-13 is stored as a bare ISBN-13 so scans, which always read ISBN-13, find it; anything else is kept as typed. `isbnVariants` also yields the ISBN-10 form (978 prefix only) so older stored values still match.

### Savings compare only fully priced volumes

Where: `lib/savings.ts` (`comparableSavings`)

Savings versus retail are counted only over owned volumes whose purchase price is known and in series that have a retail price. Anything else is left out entirely, rather than counting as 100% saved or as pure overspend.

### A bare trailing number is weak evidence of a volume

Where: `lib/volume-title.ts` (`BARE`, `parseVolumeTitle`), `services/isbn-volume.ts` (`resolveIsbnVolume`)

A title like 'ONE PIECE 3' with no volume marker is only weak evidence, since the number may belong to the title. The resolver acts on a bare-number parse only when the series part exactly matches a library series or a MangaDex title.

### Export columns are append-only

Where: `actions/import-export.ts` (`CSV_HEADERS`)

New CSV columns are added at the end, as `format` was, so spreadsheets built on the older column order keep importing.

### Import is one long transaction

Where: `actions/import-export.ts` (`importCollection`)

An import runs as a single transaction so a failure leaves nothing half-imported. The sequential upserts of a large collection need more than Prisma's default 5 s, hence a 120 s timeout.

### Import matches existing titles by external id first

Where: `actions/import-export.ts` (`importCollection`)

An imported title is matched to an existing series by MangaDex id, then Open Library key, then by title, because titles can change. A matched series keeps its own metadata, format included.

### Standalone titles always have a volume row

Where: `app/dashboard/library/[id]/page.tsx`

A standalone title renders its single volume instead of a grid and relies on that row existing. The migration and the series service guarantee it, so the page does not handle a missing row.

### Import can leave a manga looking like a single book

Where: `app/dashboard/library/[id]/page.tsx` (`EditSeriesModal` `seriesHint`)

A CSV import that lists only volume 1 of a manga leaves `totalVolumes` at 1, so it renders as a standalone book. Manga and light-novel standalone pages therefore show a hint to edit the series and set its real volume count.

### A one-volume title always gets volume 1

Where: `services/series.ts` (`needsStandaloneVolume`, `createSeries`, `updateSeries`)

A title with a total of 1 renders as a standalone book, which needs its single volume row. Creating or editing such a title therefore adds volume 1 if none exists, including older data that lacks it.

### ISBN survives switching a book to a series without a total

Where: `components/series/add-series-modal.tsx` (submit handler)

When a looked-up book is switched to Series with no total, volume 1 is created to hold its ISBN rather than dropping it.
