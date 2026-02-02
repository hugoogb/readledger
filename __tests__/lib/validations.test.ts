import {
  bulkMarkOwnedSchema,
  bulkSetReadSchema,
  seriesSchema,
  volumeSchema,
} from "@/lib/validations";
import { describe, expect, it } from "vitest";

describe("seriesSchema", () => {
  const validSeries = {
    title: "One Piece",
    status: "READING",
    publishing: false,
    totalVolumes: null,
  };

  it("accepts valid series data", () => {
    const result = seriesSchema.safeParse(validSeries);
    expect(result.success).toBe(true);
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
      publisherId: "some-uuid",
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

  it("accepts valid coverImage URL", () => {
    const result = seriesSchema.safeParse({
      ...validSeries,
      coverImage: "https://example.com/cover.jpg",
    });
    expect(result.success).toBe(true);
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
      storeId: "some-store-uuid",
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
      storeId: "some-store-id",
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
