# 0008. Server actions and errors

Status: accepted

### Expected failures are returned as values from Server Actions

Where: `lib/action-result.ts` (`ActionResult`, `withResult`), `lib/unwrap.ts` (`unwrap`)

Next.js replaces the message of any error thrown from a Server Action with a generic one in production. Expected failures (already owned, duplicate names, rate limits, validation) are therefore returned as `{ ok: false, error }` values, and callers use `unwrap()` to turn them back into thrown errors.

### Next.js control-flow errors are rethrown, not converted

Where: `lib/action-result.ts` (`withResult`)

`redirect()` and `notFound()` work by throwing errors that carry a `digest`. `withResult` rethrows any error with a digest so Next.js can handle it, instead of reporting it as a failed action.

### Unsent versus cleared fields

Where: `lib/normalize.ts` (`blankToNull`), `services/series.ts` (`updateSeries`)

Forms send an empty string for a cleared optional field, which is stored as null so the field actually clears. `undefined` means the field was not sent and is left untouched; collapsing the two would erase fields on partial updates.
