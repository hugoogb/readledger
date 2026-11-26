import { vi, beforeEach } from "vitest";
import { prismaMock } from "@/__tests__/__mocks__/prisma";
import { NotFoundError } from "@/lib/errors";
import {
  createVolume,
  updateVolume,
  deleteVolume,
  toggleVolumeRead,
  computeVolumeStats,
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
    series: {
      userId: "user-1",
      status: "READING",
      totalVolumes: 10,
      _count: { volumes: 10 },
      ...seriesOverrides,
    },
  };
}

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

  it("stores cleared notes and cover as null", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(makeVolumeWithSeries({ owned: true }));
    prismaMock.volume.update.mockResolvedValue(makeVolume());

    await updateVolume("user-1", "vol-1", { notes: "", coverImage: "" });

    expect(prismaMock.volume.update).toHaveBeenCalledWith({
      where: { id: "vol-1" },
      data: expect.objectContaining({ notes: null, coverImage: null }),
    });
  });

  it("takes a volume off the wishlist when it becomes owned", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries({ owned: false, wishlist: true }),
    );
    prismaMock.volume.update.mockResolvedValue(makeVolume());

    await updateVolume("user-1", "vol-1", { owned: true });

    expect(prismaMock.volume.update).toHaveBeenCalledWith({
      where: { id: "vol-1" },
      data: expect.objectContaining({ owned: true, wishlist: false }),
    });
  });

  it("rejects another user's store", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(makeVolumeWithSeries({ owned: true }));
    prismaMock.userStore.findFirst.mockResolvedValue(null);

    await expect(
      updateVolume("user-1", "vol-1", { storeId: "someone-elses" }),
    ).rejects.toThrow(NotFoundError);
    expect(prismaMock.volume.update).not.toHaveBeenCalled();
  });

  it("keeps an explicitly edited read date", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries({ owned: true, read: true, readDate: now }),
    );
    prismaMock.volume.update.mockResolvedValue(makeVolume());
    const readDate = new Date("2024-03-10");

    await updateVolume("user-1", "vol-1", { read: true, readDate });

    const call = prismaMock.volume.update.mock.calls[0][0];
    expect(call.data.readDate).toBe(readDate);
  });

  it("keeps the stored read date when saving a read volume without one", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries({ owned: true, read: true, readDate: now }),
    );
    prismaMock.volume.update.mockResolvedValue(makeVolume());

    await updateVolume("user-1", "vol-1", { read: true });

    const call = prismaMock.volume.update.mock.calls[0][0];
    expect(call.data.readDate).toBe(now);
  });

  it("clears the read date when marked unread", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries({ owned: true, read: true, readDate: now }),
    );
    prismaMock.volume.update.mockResolvedValue(makeVolume());

    await updateVolume("user-1", "vol-1", { read: false, readDate: now });

    const call = prismaMock.volume.update.mock.calls[0][0];
    expect(call.data.readDate).toBeNull();
  });

  it("leaves the read date untouched when read is not part of the update", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries({ owned: true }),
    );
    prismaMock.volume.update.mockResolvedValue(makeVolume());

    await updateVolume("user-1", "vol-1", { pricePaid: 7.5 });

    const call = prismaMock.volume.update.mock.calls[0][0];
    expect(call.data.readDate).toBeUndefined();
  });
});

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

  it("uses the client's local date when given", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries({ read: false }),
    );
    prismaMock.volume.update.mockResolvedValue(makeVolume({ read: true }));

    await toggleVolumeRead("user-1", "vol-1", "2026-01-01");

    const updateCall = prismaMock.volume.update.mock.calls[0][0];
    expect(updateCall.data.readDate).toEqual(new Date("2026-01-01T00:00:00Z"));
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

describe("computeVolumeStats", () => {
  it("calculates all stats correctly", () => {
    const volumes = [
      makeVolume({ id: "v1", volumeNumber: 1, owned: true, read: true, pricePaid: 5.0, wishlist: false }),
      makeVolume({ id: "v2", volumeNumber: 2, owned: true, read: false, pricePaid: 7.0, wishlist: false }),
      makeVolume({ id: "v3", volumeNumber: 3, owned: false, read: false, pricePaid: null, wishlist: true }),
    ];
    const stats = computeVolumeStats(makeSeries({ volumes, totalVolumes: 10, retailPrice: 9.99 }));

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

  it("excludes owned volumes without a price from savings", () => {
    const volumes = [
      makeVolume({ id: "v1", owned: true, pricePaid: 8.0 }),
      makeVolume({ id: "v2", volumeNumber: 2, owned: true, pricePaid: null }),
    ];
    const stats = computeVolumeStats(makeSeries({ volumes, retailPrice: 10 }));

    expect(stats.totalRetailValue).toBe(10);
    expect(stats.savings).toBe(2);
    expect(stats.savingsPercentage).toBe(20);
  });

  it("reports no savings when the series has no retail price", () => {
    const volumes = [makeVolume({ id: "v1", owned: true, pricePaid: 8.0 })];
    const stats = computeVolumeStats(makeSeries({ volumes, retailPrice: null }));

    expect(stats.totalSpent).toBe(8);
    expect(stats.savings).toBe(0);
  });
});

describe("bulkMarkOwned", () => {
  it("throws for unauthorized volumes", async () => {
    prismaMock.volume.findMany.mockResolvedValue([
      makeVolumeWithSeries({ id: "vol-1" }, { userId: "other-user" }),
    ]);

    await expect(
      bulkMarkOwned("user-1", ["vol-1"], { condition: "NEW" }),
    ).rejects.toThrow("Some volumes not found");
  });
});

describe("bulkSetRead", () => {
  it("only updates owned volumes", async () => {
    const volumes = [
      makeVolumeWithSeries({ id: "vol-1", owned: true }),
      makeVolumeWithSeries({ id: "vol-2", owned: false }),
    ];
    prismaMock.volume.findMany.mockResolvedValue(volumes);
    prismaMock.volume.updateMany.mockResolvedValue({ count: 1 });

    const result = await bulkSetRead("user-1", ["vol-1", "vol-2"]);

    expect(prismaMock.volume.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["vol-1", "vol-2"] }, owned: true, read: false },
      data: expect.objectContaining({ read: true }),
    });
    expect(result).toBeInstanceOf(Set);
    expect(result).toContain("series-1");
  });

  it("uses the given read date instead of today", async () => {
    prismaMock.volume.findMany.mockResolvedValue([
      makeVolumeWithSeries({ id: "vol-1", owned: true }),
    ]);
    prismaMock.volume.updateMany.mockResolvedValue({ count: 1 });
    const readDate = new Date("2025-06-01");

    await bulkSetRead("user-1", ["vol-1"], readDate);

    const call = prismaMock.volume.updateMany.mock.calls[0][0];
    expect(call.data.readDate).toBe(readDate);
  });
});

const book = (status: string) => ({ status, totalVolumes: 1, _count: { volumes: 1 } });

describe("status sync for standalone books", () => {
  it("completes a book when toggled to read", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries({ owned: true, read: false }, book("READING")),
    );
    prismaMock.volume.update.mockResolvedValue(makeVolume({ read: true }));

    await toggleVolumeRead("user-1", "vol-1");

    expect(prismaMock.series.update).toHaveBeenCalledWith({
      where: { id: "series-1" },
      data: { status: "COMPLETED" },
    });
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it("reopens a completed book when toggled to unread", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries({ owned: true, read: true }, book("COMPLETED")),
    );
    prismaMock.volume.update.mockResolvedValue(makeVolume({ read: false }));

    await toggleVolumeRead("user-1", "vol-1");

    expect(prismaMock.series.update).toHaveBeenCalledWith({
      where: { id: "series-1" },
      data: { status: "READING" },
    });
  });

  it("keeps a dropped book's status when toggled to unread", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries({ owned: true, read: true }, book("DROPPED")),
    );
    prismaMock.volume.update.mockResolvedValue(makeVolume({ read: false }));

    await toggleVolumeRead("user-1", "vol-1");

    expect(prismaMock.series.update).not.toHaveBeenCalled();
  });

  it("leaves a series' status alone", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries(
        { owned: true, read: false },
        { status: "READING", totalVolumes: 10, _count: { volumes: 10 } },
      ),
    );
    prismaMock.volume.update.mockResolvedValue(makeVolume({ read: true }));

    await toggleVolumeRead("user-1", "vol-1");

    expect(prismaMock.series.update).not.toHaveBeenCalled();
  });

  it("treats one total volume with several rows as a series", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries(
        { owned: true, read: false },
        { status: "READING", totalVolumes: 1, _count: { volumes: 2 } },
      ),
    );
    prismaMock.volume.update.mockResolvedValue(makeVolume({ read: true }));

    await toggleVolumeRead("user-1", "vol-1");

    expect(prismaMock.series.update).not.toHaveBeenCalled();
  });

  it("completes a book marked read from the details form", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries({ owned: true, read: false }, book("PLAN_TO_READ")),
    );
    prismaMock.volume.update.mockResolvedValue(makeVolume({ read: true }));

    await updateVolume("user-1", "vol-1", { read: true });

    expect(prismaMock.series.update).toHaveBeenCalledWith({
      where: { id: "series-1" },
      data: { status: "COMPLETED" },
    });
  });

  it("does not touch status when the read flag is unchanged", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(
      makeVolumeWithSeries({ owned: true, read: true }, book("READING")),
    );
    prismaMock.volume.update.mockResolvedValue(makeVolume());

    await updateVolume("user-1", "vol-1", { read: true, pricePaid: 5 });
    await updateVolume("user-1", "vol-1", { pricePaid: 5 });

    expect(prismaMock.series.update).not.toHaveBeenCalled();
  });

  it("completes standalone books in a bulk read", async () => {
    prismaMock.volume.findMany.mockResolvedValue([
      makeVolumeWithSeries({ id: "vol-1", owned: true, read: false }, book("READING")),
    ]);
    prismaMock.volume.updateMany.mockResolvedValue({ count: 1 });

    await bulkSetRead("user-1", ["vol-1"]);

    expect(prismaMock.series.update).toHaveBeenCalledWith({
      where: { id: "series-1" },
      data: { status: "COMPLETED" },
    });
  });

  it("skips standalone books a bulk read doesn't change", async () => {
    prismaMock.volume.findMany.mockResolvedValue([
      makeVolumeWithSeries({ id: "vol-1", owned: false, read: false }, book("READING")),
    ]);
    prismaMock.volume.updateMany.mockResolvedValue({ count: 0 });

    await bulkSetRead("user-1", ["vol-1"]);

    expect(prismaMock.series.update).not.toHaveBeenCalled();
  });
});
