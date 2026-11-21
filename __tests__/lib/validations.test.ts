import {
  bulkMarkOwnedSchema,
  bulkSetReadSchema,
  readingGoalSchema,
  seriesSchema,
  seriesVolumesSchema,
  volumeSchema,
} from "@/lib/validations";
import { describe, expect, it } from "vitest";

describe("seriesSchema", () => {
  const validSeries = {
    title: "One Piece",
    status: "READING",
    publishing: false,
    totalVolumes: null,
    format: "MANGA",
  };

  it("accepts valid series data", () => {
    const result = seriesSchema.safeParse(validSeries);
    expect(result.success).toBe(true);
  });

  it("accepts every book format", () => {
    const result = seriesSchema.safeParse({ ...validSeries, format: "NOVEL" });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown format", () => {
    const result = seriesSchema.safeParse({ ...validSeries, format: "BOOK" });
    expect(result.success).toBe(false);
  });

  it("requires a format", () => {
    const result = seriesSchema.safeParse({ ...validSeries, format: undefined });
    expect(result.success).toBe(false);
  });

  it("requires title", () => {
    const result = seriesSchema.safeParse({ ...validSeries, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title longer than 255 chars", () => {
    const result = seriesSchema.safeParse({
      ...validSeries,
      title: "a".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional author", () => {
    const result = seriesSchema.safeParse({
      ...validSeries,
      author: "Oda",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty string author", () => {
    const result = seriesSchema.safeParse({
      ...validSeries,
      author: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts publisherId as string", () => {
    const result = seriesSchema.safeParse({
      ...validSeries,
      publisherId: "3f1c2b4a-8d6e-4f7a-9b2c-1d3e5f7a9b0c",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null publisherId", () => {
    const result = seriesSchema.safeParse({
      ...validSeries,
      publisherId: null,
    });
    expect(result.success).toBe(true);
  });

  it("validates all status values", () => {
    const statuses = [
      "READING",
      "COMPLETED",
      "ON_HOLD",
      "DROPPED",
      "PLAN_TO_READ",
    ];
    for (const status of statuses) {
      const result = seriesSchema.safeParse({ ...validSeries, status });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = seriesSchema.safeParse({
      ...validSeries,
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null totalVolumes", () => {
    const result = seriesSchema.safeParse({
      ...validSeries,
      totalVolumes: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative totalVolumes", () => {
    const result = seriesSchema.safeParse({
      ...validSeries,
      totalVolumes: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a MangaDex coverImage URL", () => {
    const result = seriesSchema.safeParse({
      ...validSeries,
      coverImage: "https://uploads.mangadex.org/covers/abc/def.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a coverImage from another host (next/image would crash)", () => {
    const result = seriesSchema.safeParse({
      ...validSeries,
      coverImage: "https://example.com/cover.jpg",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an Open Library cover-ID URL", () => {
    const result = seriesSchema.safeParse({
      ...validSeries,
      coverImage: "https://covers.openlibrary.org/b/id/14856017-L.jpg",
    });
    expect(result.success).toBe(true);
  });

  it.each([
    "https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg",
    "https://covers.openlibrary.org/b/olid/OL7524304M-L.jpg",
    "http://covers.openlibrary.org/b/id/14856017-L.jpg",
    "https://covers.openlibrary.org/b/id/14856017-L.jpg?default=false",
    "https://covers.openlibrary.org/b/id/abc-L.jpg",
  ])("rejects Open Library cover URLs that are not cover-ID URLs: %s", (coverImage) => {
    expect(seriesSchema.safeParse({ ...validSeries, coverImage }).success).toBe(false);
  });

  it("accepts a Google Books thumbnail URL", () => {
    const coverImage = "https://books.google.com/books/content?id=abc_-1&printsec=frontcover&img=1&zoom=1&source=gbs_api";
    expect(seriesSchema.safeParse({ ...validSeries, coverImage }).success).toBe(true);
  });

  it.each([
    "http://books.google.com/books/content?id=abc&img=1",
    "https://books.google.com.evil.com/books/content?id=abc",
    "https://books.google.com/books?id=abc",
  ])("rejects other Google Books URLs: %s", (coverImage) => {
    expect(seriesSchema.safeParse({ ...validSeries, coverImage }).success).toBe(false);
  });

  it("rejects a non-uuid publisherId", () => {
    const result = seriesSchema.safeParse({ ...validSeries, publisherId: "pub-1" });
    expect(result.success).toBe(false);
  });

  it("caps totalVolumes", () => {
    expect(seriesSchema.safeParse({ ...validSeries, totalVolumes: 1000 }).success).toBe(true);
    expect(seriesSchema.safeParse({ ...validSeries, totalVolumes: 1001 }).success).toBe(false);
  });

  it("rejects invalid coverImage URL", () => {
    const result = seriesSchema.safeParse({
      ...validSeries,
      coverImage: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty coverImage", () => {
    const result = seriesSchema.safeParse({
      ...validSeries,
      coverImage: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects description over 2000 chars", () => {
    const result = seriesSchema.safeParse({
      ...validSeries,
      description: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts retailPrice of 0", () => {
    const result = seriesSchema.safeParse({
      ...validSeries,
      retailPrice: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative retailPrice", () => {
    const result = seriesSchema.safeParse({
      ...validSeries,
      retailPrice: -5,
    });
    expect(result.success).toBe(false);
  });
});

describe("volumeSchema", () => {
  const validVolume = {
    volumeNumber: 1,
    owned: false,
    read: false,
  };

  it("accepts valid volume data", () => {
    const result = volumeSchema.safeParse(validVolume);
    expect(result.success).toBe(true);
  });

  it("requires volumeNumber >= 1", () => {
    const result = volumeSchema.safeParse({ ...validVolume, volumeNumber: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer volumeNumber", () => {
    const result = volumeSchema.safeParse({
      ...validVolume,
      volumeNumber: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("validates condition enum", () => {
    const conditions = [
      "NEW",
      "LIKE_NEW",
      "VERY_GOOD",
      "GOOD",
      "ACCEPTABLE",
      "POOR",
    ];
    for (const condition of conditions) {
      const result = volumeSchema.safeParse({ ...validVolume, condition });
      expect(result.success).toBe(true);
    }
  });

  it("accepts storeId as string", () => {
    const result = volumeSchema.safeParse({
      ...validVolume,
      storeId: "3f1c2b4a-8d6e-4f7a-9b2c-1d3e5f7a9b0c",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null storeId", () => {
    const result = volumeSchema.safeParse({
      ...validVolume,
      storeId: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative pricePaid", () => {
    const result = volumeSchema.safeParse({
      ...validVolume,
      pricePaid: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts null pricePaid", () => {
    const result = volumeSchema.safeParse({
      ...validVolume,
      pricePaid: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects notes over 1000 chars", () => {
    const result = volumeSchema.safeParse({
      ...validVolume,
      notes: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts wishlist boolean", () => {
    const result = volumeSchema.safeParse({
      ...validVolume,
      wishlist: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("bulkMarkOwnedSchema", () => {
  const valid = {
    totalPrice: 50,
    condition: "NEW",
    purchaseDate: "2024-01-01",
  };

  it("accepts valid data", () => {
    const result = bulkMarkOwnedSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects negative totalPrice", () => {
    const result = bulkMarkOwnedSchema.safeParse({
      ...valid,
      totalPrice: -1,
    });
    expect(result.success).toBe(false);
  });

  it("requires purchaseDate", () => {
    const result = bulkMarkOwnedSchema.safeParse({
      ...valid,
      purchaseDate: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts storeId as string", () => {
    const result = bulkMarkOwnedSchema.safeParse({
      ...valid,
      storeId: "3f1c2b4a-8d6e-4f7a-9b2c-1d3e5f7a9b0c",
    });
    expect(result.success).toBe(true);
  });
});

describe("bulkSetReadSchema", () => {
  it("accepts array with at least one ID", () => {
    const result = bulkSetReadSchema.safeParse({ volumeIds: ["abc"] });
    expect(result.success).toBe(true);
  });

  it("rejects empty array", () => {
    const result = bulkSetReadSchema.safeParse({ volumeIds: [] });
    expect(result.success).toBe(false);
  });
});

describe("readingGoalSchema", () => {
  it("accepts a valid goal", () => {
    expect(readingGoalSchema.safeParse({ year: 2026, target: 60 }).success).toBe(true);
  });

  it.each([0, 1001, 2.5])("rejects target %s", (target) => {
    expect(readingGoalSchema.safeParse({ year: 2026, target }).success).toBe(false);
  });

  it("rejects an out-of-range year", () => {
    expect(readingGoalSchema.safeParse({ year: 1999, target: 10 }).success).toBe(false);
  });
});

describe("seriesSchema openLibraryKey", () => {
  const base = { title: "Dune", status: "READING", format: "NOVEL", publishing: false, totalVolumes: 1 };

  it("accepts an Open Library work key or nothing", () => {
    expect(seriesSchema.safeParse({ ...base, openLibraryKey: "OL893414W" }).success).toBe(true);
    expect(seriesSchema.safeParse({ ...base, openLibraryKey: null }).success).toBe(true);
    expect(seriesSchema.safeParse(base).success).toBe(true);
  });

  it.each(["/works/OL893414W", "OL7524304M", "OL", "x".repeat(70)])("rejects %s", (openLibraryKey) => {
    expect(seriesSchema.safeParse({ ...base, openLibraryKey }).success).toBe(false);
  });
});

describe("seriesVolumesSchema isbn", () => {
  it("keeps an owned flag", () => {
    expect(seriesVolumesSchema.parse([{ volumeNumber: 1, owned: true }])[0].owned).toBe(true);
  });

  it("stores ISBNs as bare ISBN-13", () => {
    const parsed = seriesVolumesSchema.parse([{ volumeNumber: 1, isbn: "84-9759-220-4" }]);
    expect(parsed[0].isbn).toBe("9788497592208");
  });

  it("accepts an ISBN and caps its length", () => {
    expect(seriesVolumesSchema.safeParse([{ volumeNumber: 1, isbn: "9780441013593" }]).success).toBe(true);
    expect(seriesVolumesSchema.safeParse([{ volumeNumber: 1, isbn: "9".repeat(33) }]).success).toBe(false);
  });
});
