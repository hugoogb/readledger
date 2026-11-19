// ISBN helpers shared by the add-modal search (client) and the Open Library
// actions (server). Pure, no dependencies.

/** Remove spaces/hyphens and uppercase an ISBN-10 `x` check digit. */
export function normalizeIsbn(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

export function isValidIsbn10(s: string): boolean {
  if (!/^\d{9}[\dX]$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const digit = s[i] === "X" ? 10 : Number(s[i]);
    sum += digit * (10 - i);
  }
  return sum % 11 === 0;
}

export function isValidIsbn13(s: string): boolean {
  if (!/^\d{13}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return sum % 10 === 0;
}

/**
 * The normalised ISBN when the whole query is a valid ISBN-10/13, else null.
 * A typo'd ISBN (bad checksum) is treated as an ordinary text query.
 */
export function parseIsbnQuery(query: string): string | null {
  const trimmed = query.trim();
  if (!/^[\d\s-]+[\dxX]$/.test(trimmed)) return null;
  const isbn = normalizeIsbn(trimmed);
  return isValidIsbn13(isbn) || isValidIsbn10(isbn) ? isbn : null;
}
