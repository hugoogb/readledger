# 0009. UI patterns

Status: accepted

### Cover cloth colours are muted and dark

Where: `lib/cloth.ts` (`CLOTH_COLORS`)

Placeholder covers use muted bookcloth colours from the app palette, dark enough to carry light serif text. Adding a light or saturated colour would make the title unreadable.

### Recent shelf shows six titles

Where: `actions/series.ts` (`getRecentSeries`)

The recent-series shelf asks for six titles because six fills one row of the desktop cover shelf.

### Display name null versus empty

Where: `actions/user-settings.ts` (`updateDisplayName`), `components/account/name-prompt.tsx` (`NamePrompt`)

A `null` display name means the user was never asked, which shows the first-login prompt. Skipping the prompt saves an empty string, so the prompt stays dismissed.

### Statistics Suspense is keyed by tab and year

Where: `app/dashboard/statistics/page.tsx`

The Suspense boundary is keyed by tab and year so switching either shows the skeleton instead of the previous data while the new tab streams in.

### Viewport extends under iOS safe areas

Where: `app/layout.tsx` (`viewport`)

`viewportFit: "cover"` is required because without it iOS reports `env(safe-area-inset-*)` as 0 and the home indicator sits on top of the bottom tab bar. `themeColor` values must be kept equal to `--background` in globals.css so the browser chrome blends in.

### Book panel toggles are optimistic and wait for fresh volume data

Where: `components/books/book-panel.tsx` (`BookPanel`, pending-flag prop)

The panel flips owned/read flags optimistically and decides from those flags rather than server props, so a second tap before the first save lands still flips back. Owning removes the wishlist flag, as the server does, and un-owning clears purchase details but keeps read. A toast action can fire before refreshed server props arrive, so the details modal waits until `volume` shows the flag set and opens on fresh purchase and read dates.

### Toggle grid uses minmax(0,1fr)

Where: `components/books/book-panel.tsx` (toggle grid)

Grid columns use `minmax(0,1fr)` so the toggles can shrink below their label width; plain `1fr` overflows on narrow phones.

### Month axis uses initials

Where: `components/charts/reads-per-period.tsx` (x-axis tick formatter)

The month view labels ticks with the month initial so all twelve fit at phone width; full names overlap on narrow screens.

### Greeting renders neutral on the server and local on the client

Where: `components/dashboard/greeting.tsx` (`Greeting`)

The server render says "Welcome back" and the client swaps in the time-of-day greeting and date, because the server runs in UTC and does not know the reader's timezone. Rendering local time on the server would also cause a hydration mismatch.

### Export revokes its blob URL late

Where: `components/import-export/export-button.tsx` (`ExportButton`)

The object URL is revoked after a delay instead of right after the click, because revoking synchronously can cancel the download in iOS Safari.

### Checklist ticks survive unavailable browser storage

Where: `components/manga/volume-checklist.tsx` (storage helpers)

localStorage can throw or return nothing in private windows or with blocked site data, so every access is guarded and writes also go to an in-memory map. The checklist then still works for the visit but is not saved between visits.

### Checklist hydrates through useSyncExternalStore

Where: `components/manga/volume-checklist.tsx` (`VolumeChecklist`)

The volumes render on the server so the full list is in the page's HTML for crawlers. `useSyncExternalStore` renders the empty server snapshot first and swaps in saved ticks after hydration, avoiding a hydration mismatch.

### Inputs use 16px text on iOS

Where: `components/manga/volume-checklist.tsx` (text field)

Form fields use at least 16px text because iOS Safari zooms the page when a field with smaller text is focused.

### Created publishers must be added to the caller's list

Where: `components/series/series-form-fields.tsx` (`onPublisherCreated` prop)

The callback reports a publisher created from the dropdown. Callers that keep the publisher list in state (the add modal) must append it or the new option does not show.

### Modal panel clips overflow and only the body scrolls

Where: `components/ui/modal.tsx` (`Modal`)

On phones the modal is a bottom sheet and from sm a centred card, as a flex column with a fixed header and one vertically scrolling body. The panel uses `overflow-hidden` because `overflow-y-auto` alone forces `overflow-x: auto` and shows a stray horizontal scrollbar; the body clips horizontal overflow too.

### Toasts sit at the top on phones

Where: `components/ui/toaster.tsx` (`Toaster` position)

On phones toasts appear top-centre because bottom toasts cover the Save and Confirm buttons of bottom-sheet modals.

### Volume cell buttons have an enlarged invisible touch target

Where: `components/volumes/volume-cell.tsx` (`HIT_AREA`)

The 32px buttons get a 40x44px invisible hit area that does not overlap the neighbouring button (gap-2), so they stay tappable on phones without looking larger.

### Cell actions are hover-revealed only on hover devices

Where: `components/volumes/volume-cell.tsx` (action buttons)

Touch devices cannot hover, so the action buttons are always visible there; only pointers with real hover reveal them on hover or focus, to keep covers clean. Hiding them on hover media alone would remove them on phones and tablets.

### Read date lives outside react-hook-form

Where: `components/volumes/volume-details-modal.tsx` (`VolumeDetailsModal`)

The date input holds a "YYYY-MM-DD" string and `setValueAs` converts it to a Date only on input events. The read flag and date are therefore kept outside react-hook-form and prefilled programmatically, since `setValueAs` would not convert a programmatic prefill for the Date schema.

### Volume grid uses one modal and an optimistic layer

Where: `components/volumes/volume-grid.tsx` (`VolumeGrid`)

One details modal serves the whole grid so a toast action can open any volume. Toggles go through an optimistic reducer layered over server volumes; the reducer and the server action both flip the boolean, so the UI updates instantly and reconciles when `revalidatePath` refreshes the data.

### Wishlist removal is optimistic with an undo

Where: `components/wishlist/wishlist-actions.tsx` (`WishlistActions`)

The chip collapses on click and returns only if the action fails; server revalidation removes it for good. One tap removes it, so a mis-tap while scrolling is easy and the toast offers an undo that toggles it back.

### Button loading keeps its width

Where: `components/ui/button.tsx` (`ButtonProps.loading`)

A loading button shows a spinner in place of any leading icon and is disabled, but keeps its label visible so the button's width doesn't jump while an action runs.

### Chart empty state matches chart height

Where: `components/charts/chart-empty.tsx` (`ChartEmpty`)

The empty state is 300px tall, the same as the charts, so a card with no data keeps its size instead of collapsing.

### Cover shelf grows in count, not size

Where: `components/books/cover-shelf.tsx` (`CoverShelf`)

On phones the shelf scrolls sideways; from `lg` it becomes a six-column grid so wider screens show more books rather than bigger cards.

### Logo mark matches the app icon

Where: `components/ui/logo.tsx` (`LogoMark`), `app/icon.svg`

`LogoMark` draws the same artwork as `app/icon.svg` (four spines on a shelf that doubles as a bar chart, on a double rule); a change to one must be made to the other.

### Global error recovers with a full page load

Where: `app/global-error.tsx`

The recovery link is a plain `<a>`, not `<Link>`, because `global-error` replaces the crashed root layout and only a full page load rebuilds the app; the `@next/next/no-html-link-for-pages` suppression is intentional.
