import { vi, beforeEach, describe, it, expect } from "vitest";
import { prismaMock } from "@/__tests__/__mocks__/prisma";
import { NotFoundError } from "@/lib/errors";
import {
  toggleWishlist,
  getWishlistVolumes,
  getWishlistStats,
} from "@/services/wishlist";

const baseSeries = {
  userId: "user-1",
  id: "s-1",
  title: "Test",
  coverImage: null,
  retailPrice: 9.99,
};

const baseVolume = {
  id: "vol-1",
  seriesId: "s-1",
  owned: false,
  wishlist: false,
  series: baseSeries,
};

beforeEach(() => vi.clearAllMocks());

describe("toggleWishlist", () => {
  it("toggles wishlist on for an unowned volume", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(baseVolume);
    prismaMock.volume.update.mockResolvedValue({
      ...baseVolume,
      wishlist: true,
    });

    const result = await toggleWishlist("user-1", "vol-1");

    expect(prismaMock.volume.update).toHaveBeenCalledWith({
      where: { id: "vol-1" },
      data: { wishlist: true },
    });
    expect(result).toEqual({
      updated: { ...baseVolume, wishlist: true },
      seriesId: "s-1",
    });
  });

  it("throws NotFoundError when volume does not exist", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(null);

    await expect(toggleWishlist("user-1", "missing")).rejects.toThrow(
      NotFoundError,
    );
    expect(prismaMock.volume.update).not.toHaveBeenCalled();
  });

  it("throws Error when trying to wishlist an owned volume", async () => {
    prismaMock.volume.findFirst.mockResolvedValue({
      ...baseVolume,
      owned: true,
      wishlist: false,
    });

    await expect(toggleWishlist("user-1", "vol-1")).rejects.toThrow(
      "Volume is already owned",
    );
    expect(prismaMock.volume.update).not.toHaveBeenCalled();
  });

  it("toggles wishlist off for a wishlisted volume", async () => {
    const wishlisted = { ...baseVolume, wishlist: true };
    prismaMock.volume.findFirst.mockResolvedValue(wishlisted);
    prismaMock.volume.update.mockResolvedValue({
      ...wishlisted,
      wishlist: false,
    });

    const result = await toggleWishlist("user-1", "vol-1");

    expect(prismaMock.volume.update).toHaveBeenCalledWith({
      where: { id: "vol-1" },
      data: { wishlist: false },
    });
    expect(result.updated.wishlist).toBe(false);
  });
});

describe("getWishlistVolumes", () => {
  it("returns volumes grouped by series", async () => {
    const seriesB = {
      ...baseSeries,
      id: "s-2",
      title: "Another Series",
      retailPrice: 12.99,
    };

    prismaMock.volume.findMany.mockResolvedValue([
      { ...baseVolume, wishlist: true },
      {
        id: "vol-2",
        seriesId: "s-2",
        owned: false,
        wishlist: true,
        series: seriesB,
      },
      {
        id: "vol-3",
        seriesId: "s-1",
        owned: false,
        wishlist: true,
        series: baseSeries,
      },
    ]);

    const result = await getWishlistVolumes("user-1");

    expect(result).toHaveLength(2);
    expect(result[0].series.id).toBe("s-1");
    expect(result[0].volumes).toHaveLength(2);
    expect(result[1].series.id).toBe("s-2");
    expect(result[1].volumes).toHaveLength(1);
  });

  it("returns empty array when no wishlist items exist", async () => {
    prismaMock.volume.findMany.mockResolvedValue([]);

    const result = await getWishlistVolumes("user-1");

    expect(result).toEqual([]);
  });
});

describe("getWishlistStats", () => {
  it("calculates count, estimatedCost, and seriesCount", async () => {
    prismaMock.volume.count.mockResolvedValue(3);
    prismaMock.volume.findMany.mockResolvedValue([
      { ...baseVolume, wishlist: true, series: baseSeries },
      {
        id: "vol-2",
        seriesId: "s-2",
        owned: false,
        wishlist: true,
        series: { ...baseSeries, id: "s-2", retailPrice: 12.99 },
      },
      {
        id: "vol-3",
        seriesId: "s-1",
        owned: false,
        wishlist: true,
        series: baseSeries,
      },
    ]);

    const result = await getWishlistStats("user-1");

    expect(result).toEqual({
      count: 3,
      estimatedCost: 9.99 + 12.99 + 9.99,
      seriesCount: 2,
    });
  });

  it("handles empty wishlist", async () => {
    prismaMock.volume.count.mockResolvedValue(0);
    prismaMock.volume.findMany.mockResolvedValue([]);

    const result = await getWishlistStats("user-1");

    expect(result).toEqual({
      count: 0,
      estimatedCost: 0,
      seriesCount: 0,
    });
  });
});
