# 0012. Testing

Status: accepted

### next/font is stubbed in unit tests

Where: `__tests__/lib/viewport.test.ts`

`next/font/google` and `next/font/local` only work inside the Next.js build, so tests that import `app/layout` mock both to read its exports.
