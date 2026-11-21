import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "@/__tests__/__mocks__/prisma";
import { NotFoundError } from "@/lib/errors";
import {
  findSeriesByTitle,
  findVolumeByIsbn,
  listMultiVolumeSeries,
  markVolumeOwnedByIsbn,
} from "@/services/isbn-volume";

beforeEach(() => vi.clearAllMocks());

const ISBN = "9788497592208";

describe("findVolumeByIsbn", () => {
  it("matches the ISBN-10 form too", async () => {
    prismaMock.volume.findFirst.mockResolvedValue({
      seriesId: "s1",
      volumeNumber: 3,
      owned: false,
      series: { title: "One Piece" },
    });

    const found = await findVolumeByIsbn("user-1", ISBN);

    expect(prismaMock.volume.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isbn: { in: [ISBN, "8497592204"] }, series: { userId: "user-1" } },
      }),
    );
    expect(found).toEqual({ seriesId: "s1", seriesTitle: "One Piece", volumeNumber: 3, owned: false });
  });

  it("returns null when no volume has it", async () => {
    prismaMock.volume.findFirst.mockResolvedValue(null);
    expect(await findVolumeByIsbn("user-1", ISBN)).toBeNull();
  });
});

describe("listMultiVolumeSeries", () => {
  it("excludes standalones", async () => {
    prismaMock.series.findMany.mockResolvedValue([
      { id: "a", title: "Dune", totalVolumes: 1, _count: { volumes: 1 } },
      { id: "b", title: "One Piece", totalVolumes: null, _count: { volumes: 0 } },
      { id: "c", title: "Berserk", totalVolumes: 41, _count: { volumes: 41 } },
    ]);

    expect(await listMultiVolumeSeries("user-1")).toEqual([
      { id: "b", title: "One Piece", totalVolumes: null },
      { id: "c", title: "Berserk", totalVolumes: 41 },
    ]);
  });
});

describe("findSeriesByTitle", () => {
  it("compares normalised titles", async () => {
    prismaMock.series.findMany.mockResolvedValue([
      { id: "b", title: "One Piece", totalVolumes: null, _count: { volumes: 0 } },
    ]);
    expect(await findSeriesByTitle("user-1", "one piece")).toEqual({ id: "b", title: "One Piece" });
    expect(await findSeriesByTitle("user-1", "naruto")).toBeNull();
  });
});

describe("markVolumeOwnedByIsbn", () => {
  it("marks an existing volume owned and moves the ISBN", async () => {
    prismaMock.series.findFirst.mockResolvedValue({ id: "s1", totalVolumes: 10 });
    prismaMock.volume.findFirst.mockResolvedValue({ id: "v3", purchaseDate: new Date("2025-01-01") });

    await markVolumeOwnedByIsbn("user-1", "s1", 3, ISBN);

    expect(prismaMock.volume.updateMany).toHaveBeenCalledWith({
      where: {
        series: { userId: "user-1" },
        isbn: { in: [ISBN, "8497592204"] },
        NOT: { id: "v3" },
      },
      data: { isbn: null },
    });
    expect(prismaMock.volume.update).toHaveBeenCalledWith({
      where: { id: "v3" },
      data: { owned: true, wishlist: false, isbn: ISBN },
    });
    expect(prismaMock.series.update).not.toHaveBeenCalled();
  });

  it("sets a purchase date when the volume has none", async () => {
    prismaMock.series.findFirst.mockResolvedValue({ id: "s1", totalVolumes: 10 });
    prismaMock.volume.findFirst.mockResolvedValue({ id: "v3", purchaseDate: null });

    await markVolumeOwnedByIsbn("user-1", "s1", 3, ISBN);

    expect(prismaMock.volume.update.mock.calls[0][0].data.purchaseDate).toBeInstanceOf(Date);
  });

  it("creates a missing volume row and raises totalVolumes", async () => {
    prismaMock.series.findFirst.mockResolvedValue({ id: "s1", totalVolumes: 10 });
    prismaMock.volume.findFirst.mockResolvedValue(null);

    await markVolumeOwnedByIsbn("user-1", "s1", 11, ISBN);

    expect(prismaMock.volume.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { series: { userId: "user-1" }, isbn: { in: [ISBN, "8497592204"] } } }),
    );
    expect(prismaMock.volume.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ seriesId: "s1", volumeNumber: 11, owned: true, wishlist: false, isbn: ISBN }),
    });
    expect(prismaMock.volume.create.mock.calls[0][0].data.purchaseDate).toBeInstanceOf(Date);
    expect(prismaMock.series.update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { totalVolumes: 11 } });
  });

  it("rejects another user's series", async () => {
    prismaMock.series.findFirst.mockResolvedValue(null);
    await expect(markVolumeOwnedByIsbn("user-2", "s1", 3, ISBN)).rejects.toBeInstanceOf(NotFoundError);
    expect(prismaMock.volume.update).not.toHaveBeenCalled();
  });
});
