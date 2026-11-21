import { describe, it, expect } from "vitest";
import {
  isbn10To13,
  isbnFromBarcode,
  isbnVariants,
  isValidIsbn10,
  isValidIsbn13,
  normalizeIsbn,
  parseIsbnQuery,
  toStoredIsbn,
} from "@/lib/isbn";

describe("normalizeIsbn", () => {
  it("strips spaces and hyphens and uppercases x", () => {
    expect(normalizeIsbn(" 0-8044-2957-x ")).toBe("080442957X");
    expect(normalizeIsbn("978 0 441 01359 3")).toBe("9780441013593");
  });
});

describe("isValidIsbn13", () => {
  it("accepts a valid checksum", () => {
    expect(isValidIsbn13("9780441013593")).toBe(true);
  });
  it("rejects a bad checksum, wrong length or non-digits", () => {
    expect(isValidIsbn13("9780441013594")).toBe(false);
    expect(isValidIsbn13("978044101359")).toBe(false);
    expect(isValidIsbn13("97804410135X3")).toBe(false);
  });
});

describe("isValidIsbn10", () => {
  it("accepts valid ISBN-10s, including an X check digit", () => {
    expect(isValidIsbn10("0441013597")).toBe(true);
    expect(isValidIsbn10("080442957X")).toBe(true);
  });
  it("rejects a bad checksum, wrong length or X outside the last place", () => {
    expect(isValidIsbn10("0441013598")).toBe(false);
    expect(isValidIsbn10("044101359")).toBe(false);
    expect(isValidIsbn10("X441013597")).toBe(false);
  });
});

describe("parseIsbnQuery", () => {
  it("returns the normalised ISBN when the whole query is one", () => {
    expect(parseIsbnQuery(" 978 0441013593 ")).toBe("9780441013593");
    expect(parseIsbnQuery("978-0-441-01359-3")).toBe("9780441013593");
    expect(parseIsbnQuery("0-8044-2957-x")).toBe("080442957X");
  });
  it("returns null for titles, mixed queries and typo'd ISBNs", () => {
    expect(parseIsbnQuery("dune")).toBeNull();
    expect(parseIsbnQuery("dune 9780441013593")).toBeNull();
    expect(parseIsbnQuery("9780441013594")).toBeNull();
    expect(parseIsbnQuery("")).toBeNull();
  });
});

describe("isbnFromBarcode", () => {
  it("returns the ISBN for a 978/979 EAN-13", () => {
    expect(isbnFromBarcode("9780441013593")).toBe("9780441013593");
    expect(isbnFromBarcode("9791032305690")).toBe("9791032305690");
  });
  it("rejects non-book EAN-13s (e.g. a grocery barcode) and bad checksums", () => {
    expect(isbnFromBarcode("5901234123457")).toBeNull();
    expect(isbnFromBarcode("9780441013594")).toBeNull();
    expect(isbnFromBarcode("978044101359")).toBeNull();
  });
});

describe("isbn10To13", () => {
  it("converts with a recomputed check digit", () => {
    expect(isbn10To13("8497592204")).toBe("9788497592208");
    expect(isbn10To13("080442957X")).toBe("9780804429573");
  });
});

describe("toStoredIsbn", () => {
  it("stores bare ISBN-13", () => {
    expect(toStoredIsbn("978-84-9759-220-8")).toBe("9788497592208");
    expect(toStoredIsbn("84-9759-220-4")).toBe("9788497592208");
  });

  it("leaves non-ISBN text as typed (trimmed)", () => {
    expect(toStoredIsbn(" ABC-123 ")).toBe("ABC-123");
  });
});

describe("isbnVariants", () => {
  it("adds the ISBN-10 form for 978", () => {
    expect(isbnVariants("9788497592208")).toEqual(["9788497592208", "8497592204"]);
  });

  it("979 has no ISBN-10", () => {
    expect(isbnVariants("9791032705513")).toEqual(["9791032705513"]);
  });
});
