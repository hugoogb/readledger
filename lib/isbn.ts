// ISBN helpers shared by the add-modal search (client) and the Open Library
// actions (server). Pure, no dependencies.

/** Remove spaces/hyphens and uppercase an ISBN-10 `x` check digit. */
export function normalizeIsbn(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

// EAN-13 checksum digit for the first 12 digits.
const isbn13CheckDigit = (first12: string): string => {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3);
  return String((10 - (sum % 10)) % 10);
};

// ISBN-10 check character for the first 9 digits.
const isbn10CheckDigit = (first9: string): string => {
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(first9[i]) * (10 - i);
  const check = (11 - (sum % 11)) % 11;
  return check === 10 ? "X" : String(check);
};

export function isValidIsbn10(s: string): boolean {
  return /^\d{9}[\dX]$/.test(s) && isbn10CheckDigit(s) === s[9];
}

export function isValidIsbn13(s: string): boolean {
  return /^\d{13}$/.test(s) && isbn13CheckDigit(s) === s[12];
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

/**
 * The ISBN-13 encoded by a scanned EAN-13 barcode, or null when the barcode
 * isn't a book's: ISBNs are the EAN-13 "Bookland" range, prefix 978 or 979.
 */
export function isbnFromBarcode(text: string): string | null {
  const digits = text.trim();
  return /^97[89]\d{10}$/.test(digits) && isValidIsbn13(digits) ? digits : null;
}

/** The bare ISBN-13 for a query that is a valid ISBN-10/13, else null. */
export function isbn13FromQuery(query: string): string | null {
  const isbn = parseIsbnQuery(query);
  return isbn ? toStoredIsbn(isbn) : null;
}

/** A valid normalised ISBN-10 as its ISBN-13 (978 prefix, new check digit). */
export function isbn10To13(isbn10: string): string {
  const first12 = `978${isbn10.slice(0, 9)}`;
  return first12 + isbn13CheckDigit(first12);
}

/**
 * The form ISBNs are stored in: a valid ISBN-10/13 becomes a bare ISBN-13, so
 * scans (always ISBN-13) find it. Anything else is kept as typed.
 */
export function toStoredIsbn(input: string): string {
  const isbn = normalizeIsbn(input);
  if (isValidIsbn13(isbn)) return isbn;
  if (isValidIsbn10(isbn)) return isbn10To13(isbn);
  return input.trim();
}

/** An ISBN-13 plus its ISBN-10 form (978 only), for matching older stored values. */
export function isbnVariants(isbn13: string): string[] {
  if (!isbn13.startsWith("978")) return [isbn13];
  const first9 = isbn13.slice(3, 12);
  return [isbn13, first9 + isbn10CheckDigit(first9)];
}
