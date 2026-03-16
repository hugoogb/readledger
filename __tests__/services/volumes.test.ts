import { vi, beforeEach } from "vitest";
import { prismaMock } from "@/__tests__/__mocks__/prisma";
import { NotFoundError } from "@/lib/errors";
import {
  createVolume,
  updateVolume,
  deleteVolume,
  toggleVolumeOwned,
  toggleVolumeRead,
  markVolumesOwned,
  markVolumesRead,
  getVolumeStats,
  bulkMarkOwned,
  bulkSetRead,
} from "@/services/volumes";

beforeEach(() => vi.clearAllMocks());

const now = new Date("2026-01-15T12:00:00Z");

function makeVolume(overrides = {}) {
  return {
    id: "vol-1",
    seriesId: "series-1",
    volumeNumber: 1,
    owned: false,
    read: false,
    wishlist: false,
    pricePaid: null,
    purchaseDate: null,
    readDate: null,
    storeId: null,
    condition: null,
    notes: null,
    coverImage: null,
    title: null,
    isbn: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeSeries(overrides = {}) {
  return {
    id: "series-1",
    userId: "user-1",
    title: "One Piece",
    status: "READING",
    totalVolumes: 10,
    retailPrice: 9.99,
    publishing: true,
    volumes: [],
    ...overrides,
  };
}

function makeVolumeWithSeries(volOverrides = {}, seriesOverrides = {}) {
  return {
    ...makeVolume(volOverrides),
    series: { userId: "user-1", ...seriesOverrides },
  };
}

// --- createVolume ---

describe("createVolume", () => {
  it("throws NotFoundError if series is not owned by user", async () => {
    prismaMock.series.findFirst.mockResolvedValue(null);

    await expect(
      createVolume("user-1", {
        seriesId: "series-1",
        volumeNumber: 1,
        owned: false,
        read: false,
        wishlist: false,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("auto-sets purchaseDate when owned is true", async () => {
    prismaMock.series.findFirst.mockResolvedValue(makeSeries());
    prismaMock.volume.create.mockResolvedValue(makeVolume({ owned: true }));

    await createVolume("user-1", {
      seriesId: "series-1",
      volumeNumber: 1,
      owned: true,
      read: false,
      wishlist: false,
    });

    const createCall = prismaMock.volume.create.mock.calls[0][0];
    expect(createCall.data.purchaseDate).toBeInstanceOf(Date);
  });

  it("auto-sets readDate when read is true", async () => {
    prismaMock.series.findFirst.mockResolvedValue(makeSeries());
    prismaMock.volume.create.mockResolvedValue(
      makeVolume({ owned: true, read: true }),
    );

    await createVolume("user-1", {
      seriesId: "series-1",
      volumeNumber: 1,
      owned: true,
      read: true,
      wishlist: false,
    });

    const createCall = prismaMock.volume.create.mock.calls[0][0];
    expect(createCall.data.readDate).toBeInstanceOf(Date);
  });
});

// --- updateVolume ---

describe("updateVolume", () => {
  it("updates an owned volume", async () => {
    const volume = makeVolumeWithSeries({ owned: true });
    prismaMock.volume.findFirst.mockResolvedValue(volume);
    const updated = makeVolume({ owned: true, pricePaid: 7.5 });
    prismaMock.volume.update.mockResolvedValue(updated);

    const result = await updateVolume("user-1", "vol-1", { pricePaid: 7.5 });

    expect(prismaMock.volume.update).toHaveBeenCalledWith({
      where: { id: "vol-1" },
      data: expect.objectContaining({ pricePaid: 7.5 }),
    });
    expect(result).toEqual(updated);
  });

  it("throws NotFoundError for unauthorized user", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries({}, { userId: "other-user" }),
    );

    await expect(
      updateVolume("user-1", "vol-1", { pricePaid: 7.5 }),
    ).rejects.toThrow(NotFoundError);
  });
});

// --- deleteVolume ---

describe("deleteVolume", () => {
  it("deletes volume and returns seriesId", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(makeVolumeWithSeries());
    prismaMock.volume.delete.mockResolvedValue(makeVolume());

    const result = await deleteVolume("user-1", "vol-1");

    expect(prismaMock.volume.delete).toHaveBeenCalledWith({
      where: { id: "vol-1" },
    });
    expect(result).toBe("series-1");
  });

  it("throws NotFoundError if volume not found", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(null);

    await expect(deleteVolume("user-1", "vol-1")).rejects.toThrow(
      NotFoundError,
    );
  });
});

// --- toggleVolumeOwned ---

describe("toggleVolumeOwned", () => {
  it("toggles to owned: clears wishlist, sets purchaseDate", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries({ owned: false, wishlist: true }),
    );
    const updated = makeVolume({ owned: true, wishlist: false });
    prismaMock.volume.update.mockResolvedValue(updated);

    const result = await toggleVolumeOwned("user-1", "vol-1");

    expect(prismaMock.volume.update).toHaveBeenCalledWith({
      where: { id: "vol-1" },
      data: expect.objectContaining({
        owned: true,
        wishlist: false,
      }),
    });
    const updateCall = prismaMock.volume.update.mock.calls[0][0];
    expect(updateCall.data.purchaseDate).toBeInstanceOf(Date);
    expect(result).toEqual({ updated, seriesId: "series-1" });
  });

  it("toggles to not owned: clears purchaseDate", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries({ owned: true, purchaseDate: now }),
    );
    const updated = makeVolume({ owned: false, purchaseDate: null });
    prismaMock.volume.update.mockResolvedValue(updated);

    const result = await toggleVolumeOwned("user-1", "vol-1");

    expect(prismaMock.volume.update).toHaveBeenCalledWith({
      where: { id: "vol-1" },
      data: expect.objectContaining({
        owned: false,
        purchaseDate: null,
      }),
    });
    expect(result).toEqual({ updated, seriesId: "series-1" });
  });

  it("throws NotFoundError for unauthorized user", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(null);

    await expect(toggleVolumeOwned("user-1", "vol-1")).rejects.toThrow(
      NotFoundError,
    );
  });
});

// --- toggleVolumeRead ---

describe("toggleVolumeRead", () => {
  it("toggles read on: sets readDate", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries({ read: false }),
    );
    const updated = makeVolume({ read: true });
    prismaMock.volume.update.mockResolvedValue(updated);

    const result = await toggleVolumeRead("user-1", "vol-1");

    const updateCall = prismaMock.volume.update.mock.calls[0][0];
    expect(updateCall.data.read).toBe(true);
    expect(updateCall.data.readDate).toBeInstanceOf(Date);
    expect(result).toEqual({ updated, seriesId: "series-1" });
  });

  it("toggles read off: clears readDate", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries({ read: true, readDate: now }),
    );
    const updated = makeVolume({ read: false, readDate: null });
    prismaMock.volume.update.mockResolvedValue(updated);

    const result = await toggleVolumeRead("user-1", "vol-1");

    const updateCall = prismaMock.volume.update.mock.calls[0][0];
    expect(updateCall.data.read).toBe(false);
    expect(updateCall.data.readDate).toBeNull();
    expect(result).toEqual({ updated, seriesId: "series-1" });
  });
});

// --- markVolumesOwned ---

describe("markVolumesOwned", () => {
  it("marks volumes as owned and clears wishlist", async () => {
    prismaMock.series.findFirst.mockResolvedValue(makeSeries());
    prismaMock.volume.updateMany.mockResolvedValue({ count: 3 });

    await markVolumesOwned("user-1", "series-1", [1, 2, 3], true);

    expect(prismaMock.volume.updateMany).toHaveBeenCalledWith({
      where: {
        seriesId: "series-1",
        volumeNumber: { in: [1, 2, 3] },
      },
      data: expect.objectContaining({
        owned: true,
        wishlist: false,
      }),
    });
    const updateCall = prismaMock.volume.updateMany.mock.calls[0][0];
    expect(updateCall.data.purchaseDate).toBeInstanceOf(Date);
  });

  it("throws NotFoundError if series not found", async () => {
    prismaMock.series.findFirst.mockResolvedValue(null);

    await expect(
      markVolumesOwned("user-1", "series-1", [1, 2], true),
    ).rejects.toThrow(NotFoundError);
  });
});

// --- markVolumesRead ---

describe("markVolumesRead", () => {
  it("only marks owned volumes as read", async () => {
    prismaMock.series.findFirst.mockResolvedValue(makeSeries());
    prismaMock.volume.updateMany.mockResolvedValue({ count: 2 });

    await markVolumesRead("user-1", "series-1", [1, 2, 3], true);

    expect(prismaMock.volume.updateMany).toHaveBeenCalledWith({
      where: {
        seriesId: "series-1",
        volumeNumber: { in: [1, 2, 3] },
        owned: true,
      },
      data: expect.objectContaining({
        read: true,
      }),
    });
    const updateCall = prismaMock.volume.updateMany.mock.calls[0][0];
    expect(updateCall.data.readDate).toBeInstanceOf(Date);
  });
});

// --- getVolumeStats ---

describe("getVolumeStats", () => {
  it("calculates all stats correctly", async () => {
    const volumes = [
      makeVolume({ id: "v1", volumeNumber: 1, owned: true, read: true, pricePaid: 5.0, wishlist: false }),
      makeVolume({ id: "v2", volumeNumber: 2, owned: true, read: false, pricePaid: 7.0, wishlist: false }),
      makeVolume({ id: "v3", volumeNumber: 3, owned: false, read: false, pricePaid: null, wishlist: true }),
    ];
    prismaMock.series.findFirst.mockResolvedValue(
      makeSeries({ volumes, totalVolumes: 10, retailPrice: 9.99 }),
    );

    const stats = await getVolumeStats("user-1", "series-1");

    expect(stats.owned).toBe(2);
    expect(stats.read).toBe(1);
    expect(stats.wishlisted).toBe(1);
    expect(stats.total).toBe(10);
    expect(stats.missing).toBe(8);
    expect(stats.totalSpent).toBe(12.0);
    expect(stats.totalRetailValue).toBe(2 * 9.99);
    expect(stats.averagePrice).toBe(6.0);
    expect(stats.savings).toBeCloseTo(2 * 9.99 - 12.0);
    expect(stats.savingsPercentage).toBeCloseTo(
      ((2 * 9.99 - 12.0) / (2 * 9.99)) * 100,
    );
    expect(stats.ownedProgress).toBe(20);
    expect(stats.readProgress).toBe(50);
  });

  it("throws NotFoundError if series not found", async () => {
    prismaMock.series.findFirst.mockResolvedValue(null);

    await expect(getVolumeStats("user-1", "series-1")).rejects.toThrow(
      NotFoundError,
    );
  });
});

// --- bulkMarkOwned ---

describe("bulkMarkOwned", () => {
  it("throws on empty array", async () => {
    await expect(
      bulkMarkOwned("user-1", [], { condition: "NEW" }),
    ).rejects.toThrow("No volumes selected");
  });

  it("throws on more than 500 items", async () => {
    const ids = Array.from({ length: 501 }, (_, i) => `vol-${i}`);

    await expect(
      bulkMarkOwned("user-1", ids, { condition: "NEW" }),
    ).rejects.toThrow("Cannot process more than 500 volumes at once");
  });

  it("throws for unauthorized volumes", async () => {
    prismaMock.volume.findMany.mockResolvedValue([
      makeVolumeWithSeries({ id: "vol-1" }, { userId: "other-user" }),
    ]);

    await expect(
      bulkMarkOwned("user-1", ["vol-1"], { condition: "NEW" }),
    ).rejects.toThrow("Unauthorized");
  });
});

// --- bulkSetRead ---

describe("bulkSetRead", () => {
  it("throws on empty array", async () => {
    await expect(bulkSetRead("user-1", [])).rejects.toThrow(
      "No volumes selected",
    );
  });

  it("only updates owned volumes", async () => {
    const volumes = [
      makeVolumeWithSeries({ id: "vol-1", owned: true }),
      makeVolumeWithSeries({ id: "vol-2", owned: false }),
    ];
    prismaMock.volume.findMany.mockResolvedValue(volumes);
    prismaMock.volume.updateMany.mockResolvedValue({ count: 1 });

    const result = await bulkSetRead("user-1", ["vol-1", "vol-2"]);

    expect(prismaMock.volume.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["vol-1", "vol-2"] }, owned: true },
      data: expect.objectContaining({ read: true }),
    });
    expect(result).toBeInstanceOf(Set);
    expect(result).toContain("series-1");
  });
});
