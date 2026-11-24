import { vi, beforeEach } from "vitest";
import { prismaMock } from "@/__tests__/__mocks__/prisma";
import { NotFoundError } from "@/lib/errors";
import {
  createSeries,
  updateSeries,
  deleteSeries,
  getAllSeries,
  getSeriesStats,
  getExistingMangadexIds,
  getExistingOpenLibraryKeys,
  getFormatCounts,
  getLibraryFormats,
} from "@/services/series";

// ---------------------------------------------------------------------------
// Helpers – realistic mock data
// ---------------------------------------------------------------------------

const USER_ID = "user-001";
const SERIES_ID = "series-001";
const now = new Date("2026-03-16T12:00:00Z");

function makeSeries(overrides: Record<string, unknown> = {}) {
  return {
    id: SERIES_ID,
    userId: USER_ID,
    title: "Chainsaw Man",
    author: "Tatsuki Fujimoto",
    status: "READING" as const,
    totalVolumes: 17,
    coverImage: "https://example.com/cover.jpg",
    description: "A manga about chainsaws",
    createdAt: now,
    updatedAt: now,
    retailPrice: 9.99,
    mangadexId: "mdx-001",
    publishing: true,
    publisherId: "pub-001",
    ...overrides,
  };
}

function makeVolume(overrides: Record<string, unknown> = {}) {
  return {
    id: "vol-001",
    seriesId: SERIES_ID,
    volumeNumber: 1,
    owned: true,
    read: false,
    wishlist: false,
    pricePaid: 7.99,
    condition: "NEW" as const,
    purchaseDate: now,
    readDate: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    isbn: null,
    coverImage: null,
    title: null,
    storeId: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => vi.clearAllMocks());

// ---- createSeries ---------------------------------------------------------

describe("createSeries", () => {
  it("creates a series with the correct userId and normalizes publisherId", async () => {
    const input = {
      title: "Chainsaw Man",
      author: "Tatsuki Fujimoto",
      status: "READING" as const,
      format: "MANGA" as const,
      publishing: true,
      totalVolumes: 17,
      publisherId: "pub-001",
    };
    prismaMock.publisher.findFirst.mockResolvedValue({ id: "pub-001" } as never);
    prismaMock.series.create.mockResolvedValue(makeSeries());

    await createSeries(USER_ID, input);

    expect(prismaMock.series.create).toHaveBeenCalledWith({
      data: { ...input, userId: USER_ID, publisherId: "pub-001", volumes: { create: [] } },
      include: { volumes: true },
    });
  });

  it("sets publisherId to null when it is empty string", async () => {
    prismaMock.series.create.mockResolvedValue(makeSeries({ publisherId: null }));

    await createSeries(USER_ID, {
      title: "Solo Leveling",
      status: "PLAN_TO_READ",
      format: "MANGA",
      publishing: false,
      totalVolumes: null,
      publisherId: "",
    });

    expect(prismaMock.series.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ publisherId: null }) }),
    );
  });

  it("writes owned volumes with a purchase date", async () => {
    prismaMock.series.create.mockResolvedValue(makeSeries());
    const input = { title: "Dr. Slump", status: "READING" as const, format: "MANGA" as const, publishing: false, totalVolumes: 15 };

    await createSeries(USER_ID, input, [
      { volumeNumber: 10 },
      { volumeNumber: 11, owned: true, isbn: "9788468476117" },
    ]);

    const created = prismaMock.series.create.mock.calls[0][0].data.volumes.create;
    expect(created[0]).toMatchObject({ volumeNumber: 10, owned: false, purchaseDate: null });
    expect(created[1]).toMatchObject({ volumeNumber: 11, owned: true, isbn: "9788468476117" });
    expect(created[1].purchaseDate).toBeInstanceOf(Date);
  });

  it("creates a series with nested volumes", async () => {
    const input = {
      title: "Spy x Family",
      status: "READING" as const,
      format: "MANGA" as const,
      publishing: true,
      totalVolumes: 13,
    };
    const volumes = [
      { volumeNumber: 1, title: "Vol 1", coverImage: "https://example.com/1.jpg" },
      { volumeNumber: 2, title: "Vol 2", coverImage: null },
    ];
    const expected = makeSeries({
      title: "Spy x Family",
      volumes: [makeVolume({ volumeNumber: 1 }), makeVolume({ volumeNumber: 2, id: "vol-002" })],
    });
    prismaMock.series.create.mockResolvedValue(expected);

    const result = await createSeries(USER_ID, input, volumes);

    expect(result).toEqual(expected);
    expect(prismaMock.series.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: USER_ID,
        volumes: {
          create: expect.arrayContaining([
            expect.objectContaining({ volumeNumber: 1, title: "Vol 1", owned: false, read: false }),
            expect.objectContaining({ volumeNumber: 2, title: "Vol 2", owned: false, read: false }),
          ]),
        },
      }),
      include: { volumes: true },
    });
  });

  it("maps volume inputs correctly, setting coverImage to null when falsy", async () => {
    const input = {
      title: "Jujutsu Kaisen",
      status: "READING" as const,
      format: "MANGA" as const,
      publishing: true,
      totalVolumes: 5,
    };
    const volumes = [
      { volumeNumber: 1 },
      { volumeNumber: 2, coverImage: "" },
    ];
    const expected = makeSeries({ title: "Jujutsu Kaisen" });
    prismaMock.series.create.mockResolvedValue(expected);

    await createSeries(USER_ID, input, volumes);

    const call = prismaMock.series.create.mock.calls[0][0];
    expect(call.data.volumes.create[0].coverImage).toBeNull();
    expect(call.data.volumes.create[1].coverImage).toBeNull();
  });
});

describe("createSeries with an ISBN", () => {
  it("stores the ISBN on the volume", async () => {
    prismaMock.series.create.mockResolvedValue(makeSeries());

    await createSeries(
      USER_ID,
      {
        title: "Dune",
        status: "READING",
        format: "NOVEL",
        publishing: false,
        totalVolumes: 1,
        openLibraryKey: "OL893414W",
      },
      [{ volumeNumber: 1, isbn: "9780441013593" }],
    );

    const call = prismaMock.series.create.mock.calls[0][0];
    expect(call.data.openLibraryKey).toBe("OL893414W");
    expect(call.data.volumes.create).toEqual([
      expect.objectContaining({ volumeNumber: 1, isbn: "9780441013593" }),
    ]);
  });
});

describe("createSeries for a standalone book", () => {
  it("creates volume 1 when no volumes are given", async () => {
    prismaMock.series.create.mockResolvedValue(makeSeries());

    await createSeries(
      USER_ID,
      { title: "Dune", status: "READING", format: "NOVEL", publishing: false, totalVolumes: 1 },
      [],
    );

    const call = prismaMock.series.create.mock.calls[0][0];
    expect(call.data.volumes.create).toEqual([
      expect.objectContaining({ volumeNumber: 1, owned: false, read: false }),
    ]);
  });
});

// ---- updateSeries ---------------------------------------------------------

describe("updateSeries", () => {
  it("updates an existing series", async () => {
    const existing = makeSeries({ volumes: [] });
    prismaMock.series.findFirst.mockResolvedValue(existing);
    const updatedData = makeSeries({ title: "Chainsaw Man Part 2" });
    prismaMock.series.update.mockResolvedValue(updatedData);

    const result = await updateSeries(USER_ID, SERIES_ID, { title: "Chainsaw Man Part 2" });

    expect(result).toEqual(updatedData);
    expect(prismaMock.series.findFirst).toHaveBeenCalledWith({
      where: { id: SERIES_ID, userId: USER_ID },
      include: { volumes: { select: { volumeNumber: true } } },
    });
    expect(prismaMock.series.update).toHaveBeenCalledWith({
      where: { id: SERIES_ID },
      data: expect.objectContaining({ title: "Chainsaw Man Part 2" }),
    });
  });

  it("clears the publisher and blank text fields", async () => {
    prismaMock.series.findFirst.mockResolvedValue(makeSeries({ volumes: [] }));
    prismaMock.series.update.mockResolvedValue(makeSeries());

    await updateSeries(USER_ID, SERIES_ID, { publisherId: null, author: "", description: "" });

    expect(prismaMock.series.update).toHaveBeenCalledWith({
      where: { id: SERIES_ID },
      data: expect.objectContaining({ publisherId: null, author: null, description: null }),
    });
  });

  it("leaves the publisher alone when it isn't sent", async () => {
    prismaMock.series.findFirst.mockResolvedValue(makeSeries({ volumes: [] }));
    prismaMock.series.update.mockResolvedValue(makeSeries());

    await updateSeries(USER_ID, SERIES_ID, { title: "X" });

    expect(prismaMock.series.update).toHaveBeenCalledWith({
      where: { id: SERIES_ID },
      data: expect.objectContaining({ publisherId: undefined }),
    });
  });

  it("rejects another user's publisher", async () => {
    prismaMock.series.findFirst.mockResolvedValue(makeSeries({ volumes: [] }));
    prismaMock.publisher.findFirst.mockResolvedValue(null);

    await expect(
      updateSeries(USER_ID, SERIES_ID, { publisherId: "someone-elses" }),
    ).rejects.toThrow(NotFoundError);
    expect(prismaMock.series.update).not.toHaveBeenCalled();
  });

  it("creates volume 1 for a one-volume title that has no volume rows", async () => {
    prismaMock.series.findFirst.mockResolvedValue(makeSeries({ totalVolumes: 1, volumes: [] }));
    prismaMock.series.update.mockResolvedValue(makeSeries({ totalVolumes: 1 }));

    await updateSeries(USER_ID, SERIES_ID, { totalVolumes: 1 });

    expect(prismaMock.volume.createMany).toHaveBeenCalledWith({
      data: [{ seriesId: SERIES_ID, volumeNumber: 1, owned: false, read: false }],
      skipDuplicates: true,
    });
  });

  it("does not add volumes to a one-volume title that already has its row", async () => {
    prismaMock.series.findFirst.mockResolvedValue(
      makeSeries({ totalVolumes: 1, volumes: [{ volumeNumber: 1 }] }),
    );
    prismaMock.series.update.mockResolvedValue(makeSeries({ totalVolumes: 1 }));

    await updateSeries(USER_ID, SERIES_ID, { totalVolumes: 1 });

    expect(prismaMock.volume.createMany).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when series does not exist", async () => {
    prismaMock.series.findFirst.mockResolvedValue(null);

    await expect(
      updateSeries(USER_ID, "nonexistent-id", { title: "Nothing" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("auto-creates volumes when totalVolumes increases", async () => {
    const existingVolumes = [
      makeVolume({ id: "vol-1", volumeNumber: 1 }),
      makeVolume({ id: "vol-3", volumeNumber: 3 }),
    ];
    const existing = makeSeries({ totalVolumes: 3, volumes: existingVolumes });
    prismaMock.series.findFirst.mockResolvedValue(existing);
    prismaMock.series.update.mockResolvedValue(makeSeries({ totalVolumes: 5 }));
    prismaMock.volume.createMany.mockResolvedValue({ count: 3 });

    await updateSeries(USER_ID, SERIES_ID, { totalVolumes: 5 });

    expect(prismaMock.volume.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        { seriesId: SERIES_ID, volumeNumber: 2, owned: false, read: false },
        { seriesId: SERIES_ID, volumeNumber: 4, owned: false, read: false },
        { seriesId: SERIES_ID, volumeNumber: 5, owned: false, read: false },
      ]),
      skipDuplicates: true,
    });
    // Should be exactly 3 new volumes (2, 4, 5) since 1 and 3 already exist
    expect(prismaMock.volume.createMany.mock.calls[0][0].data).toHaveLength(3);
  });

  it("does not create duplicates for existing volume numbers", async () => {
    const existingVolumes = [
      makeVolume({ id: "vol-1", volumeNumber: 1 }),
      makeVolume({ id: "vol-2", volumeNumber: 2 }),
      makeVolume({ id: "vol-3", volumeNumber: 3 }),
    ];
    const existing = makeSeries({ totalVolumes: 3, volumes: existingVolumes });
    prismaMock.series.findFirst.mockResolvedValue(existing);
    prismaMock.series.update.mockResolvedValue(makeSeries({ totalVolumes: 3 }));

    // totalVolumes stays the same, so no new volumes should be created
    await updateSeries(USER_ID, SERIES_ID, { totalVolumes: 3 });

    expect(prismaMock.volume.createMany).not.toHaveBeenCalled();
  });
});

// ---- deleteSeries ---------------------------------------------------------

describe("deleteSeries", () => {
  it("deletes an owned series", async () => {
    prismaMock.series.findFirst.mockResolvedValue(makeSeries());
    prismaMock.series.delete.mockResolvedValue(makeSeries());

    await deleteSeries(USER_ID, SERIES_ID);

    expect(prismaMock.series.findFirst).toHaveBeenCalledWith({
      where: { id: SERIES_ID, userId: USER_ID },
    });
    expect(prismaMock.series.delete).toHaveBeenCalledWith({
      where: { id: SERIES_ID },
    });
  });

  it("throws NotFoundError when series does not exist", async () => {
    prismaMock.series.findFirst.mockResolvedValue(null);

    await expect(
      deleteSeries(USER_ID, "nonexistent-id"),
    ).rejects.toThrow(NotFoundError);
  });
});

// ---- getAllSeries ----------------------------------------------------------

describe("getAllSeries", () => {
  it("returns series with default ordering (updatedAt desc)", async () => {
    const seriesList = [makeSeries()];
    prismaMock.series.findMany.mockResolvedValue(seriesList);

    const result = await getAllSeries(USER_ID);

    expect(result).toEqual(seriesList);
    expect(prismaMock.series.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      select: expect.objectContaining({ id: true, title: true }),
      orderBy: { updatedAt: "desc" },
    });
  });

  it("searches titles case-insensitively in the database", async () => {
    prismaMock.series.findMany.mockResolvedValue([]);

    await getAllSeries(USER_ID, { search: "chain" });

    expect(prismaMock.series.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, title: { contains: "chain", mode: "insensitive" } },
      }),
    );
  });

  it("filters by format", async () => {
    prismaMock.series.findMany.mockResolvedValue([]);

    await getAllSeries(USER_ID, { format: "NOVEL", status: "COMPLETED" });

    expect(prismaMock.series.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, status: "COMPLETED", format: "NOVEL" },
        select: expect.objectContaining({ format: true }),
      }),
    );
  });

  it("sorts by completion percentage client-side", async () => {
    const seriesA = makeSeries({
      id: "series-a",
      title: "Series A",
      totalVolumes: 10,
      volumes: [
        makeVolume({ owned: true }),
        makeVolume({ id: "vol-2", volumeNumber: 2, owned: false }),
      ],
    });
    const seriesB = makeSeries({
      id: "series-b",
      title: "Series B",
      totalVolumes: 4,
      volumes: [
        makeVolume({ owned: true }),
        makeVolume({ id: "vol-2b", volumeNumber: 2, owned: true }),
      ],
    });
    // A = 1/10 = 10%, B = 2/4 = 50%  => B should come first
    prismaMock.series.findMany.mockResolvedValue([seriesA, seriesB]);

    const result = await getAllSeries(USER_ID, { sort: "completion" });

    expect(result[0].id).toBe("series-b");
    expect(result[1].id).toBe("series-a");
  });

  it("sorts by total spent client-side", async () => {
    const seriesLow = makeSeries({
      id: "series-low",
      title: "Low Spent",
      volumes: [makeVolume({ pricePaid: 5.0 })],
    });
    const seriesHigh = makeSeries({
      id: "series-high",
      title: "High Spent",
      volumes: [
        makeVolume({ pricePaid: 20.0 }),
        makeVolume({ id: "vol-2h", volumeNumber: 2, pricePaid: 15.0 }),
      ],
    });
    // High = 35, Low = 5  => High should come first
    prismaMock.series.findMany.mockResolvedValue([seriesLow, seriesHigh]);

    const result = await getAllSeries(USER_ID, { sort: "spent" });

    expect(result[0].id).toBe("series-high");
    expect(result[1].id).toBe("series-low");
  });
});

describe("getLibraryFormats", () => {
  it("returns the distinct formats in enum order", async () => {
    prismaMock.series.findMany.mockResolvedValue([{ format: "NOVEL" }, { format: "MANGA" }]);

    const result = await getLibraryFormats(USER_ID);

    expect(result).toEqual(["MANGA", "NOVEL"]);
    expect(prismaMock.series.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      select: { format: true },
      distinct: ["format"],
    });
  });
});

// ---- getSeriesStats -------------------------------------------------------

describe("getSeriesStats", () => {
  it("ignores unpriced volumes and series without retail in savings", async () => {
    prismaMock.series.findMany.mockResolvedValue([
      makeSeries({
        id: "s1",
        retailPrice: 10.0,
        volumes: [
          makeVolume({ id: "v1", volumeNumber: 1, owned: true, pricePaid: 8.0 }),
          makeVolume({ id: "v2", volumeNumber: 2, owned: true, pricePaid: null }),
        ],
      }),
      makeSeries({
        id: "s2",
        retailPrice: null,
        volumes: [makeVolume({ id: "v3", volumeNumber: 1, owned: true, pricePaid: 15.0 })],
      }),
    ]);

    const stats = await getSeriesStats(USER_ID);

    expect(stats.totalSpent).toBe(23);
    expect(stats.totalRetailValue).toBe(10);
    expect(stats.totalSavings).toBe(2);
    expect(stats.savingsPercentage).toBe(20);
  });

  it("calculates all stats correctly", async () => {
    const series = [
      makeSeries({
        id: "s1",
        status: "READING",
        totalVolumes: 5,
        retailPrice: 10.0,
        volumes: [
          makeVolume({ id: "v1", volumeNumber: 1, owned: true, read: true, pricePaid: 7.0 }),
          makeVolume({ id: "v2", volumeNumber: 2, owned: true, read: false, pricePaid: 8.0 }),
          makeVolume({ id: "v3", volumeNumber: 3, owned: false, read: false, pricePaid: null }),
        ],
      }),
      makeSeries({
        id: "s2",
        status: "COMPLETED",
        totalVolumes: 2,
        retailPrice: 12.0,
        volumes: [
          makeVolume({ id: "v4", volumeNumber: 1, owned: true, read: true, pricePaid: 9.0 }),
          makeVolume({ id: "v5", volumeNumber: 2, owned: true, read: true, pricePaid: 10.0 }),
        ],
      }),
    ];
    prismaMock.series.findMany.mockResolvedValue(series);

    const stats = await getSeriesStats(USER_ID);

    // totalSeries = 2
    expect(stats.totalSeries).toBe(2);
    // owned: v1, v2, v4, v5 = 4
    expect(stats.totalVolumesOwned).toBe(4);
    // read: v1, v4, v5 = 3
    expect(stats.totalVolumesRead).toBe(3);
    // spent: 7 + 8 + 0 + 9 + 10 = 34
    expect(stats.totalSpent).toBe(34);
    // retailValue: s1 has 2 owned * 10 = 20, s2 has 2 owned * 12 = 24 => 44
    expect(stats.totalRetailValue).toBe(44);
    // savings: 44 - 34 = 10
    expect(stats.totalSavings).toBe(10);
    // savingsPercentage: (10/44)*100
    expect(stats.savingsPercentage).toBeCloseTo((10 / 44) * 100);
    // totalExpected: 5 + 2 = 7
    expect(stats.totalExpectedVolumes).toBe(7);
    // averagePrice: 34 / 4 = 8.5
    expect(stats.averagePrice).toBe(8.5);
    // collectionProgress: (4/7)*100
    expect(stats.collectionProgress).toBeCloseTo((4 / 7) * 100);
    // readingProgress: (3/4)*100
    expect(stats.readingProgress).toBeCloseTo((3 / 4) * 100);
    // byStatus
    expect(stats.byStatus).toEqual({
      reading: 1,
      completed: 1,
      onHold: 0,
      dropped: 0,
      planToRead: 0,
    });
  });

  it("handles an empty collection", async () => {
    prismaMock.series.findMany.mockResolvedValue([]);

    const stats = await getSeriesStats(USER_ID);

    expect(stats.totalSeries).toBe(0);
    expect(stats.totalVolumesOwned).toBe(0);
    expect(stats.totalVolumesRead).toBe(0);
    expect(stats.totalSpent).toBe(0);
    expect(stats.totalRetailValue).toBe(0);
    expect(stats.totalSavings).toBe(0);
    expect(stats.savingsPercentage).toBe(0);
    expect(stats.totalExpectedVolumes).toBe(0);
    expect(stats.averagePrice).toBe(0);
    expect(stats.collectionProgress).toBe(0);
    expect(stats.readingProgress).toBe(0);
  });
});

// ---- getExistingMangadexIds -----------------------------------------------

describe("getExistingMangadexIds", () => {
  it("filters to only existing mangadex IDs", async () => {
    prismaMock.series.findMany.mockResolvedValue([
      { mangadexId: "mdx-001" },
      { mangadexId: "mdx-003" },
    ]);

    const result = await getExistingMangadexIds(USER_ID, [
      "mdx-001",
      "mdx-002",
      "mdx-003",
    ]);

    expect(result).toEqual(["mdx-001", "mdx-003"]);
    expect(prismaMock.series.findMany).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        mangadexId: { in: ["mdx-001", "mdx-002", "mdx-003"] },
      },
      select: { mangadexId: true },
    });
  });
});

// ---- getExistingOpenLibraryKeys -------------------------------------------

describe("getExistingOpenLibraryKeys", () => {
  it("returns the keys already in the library", async () => {
    prismaMock.series.findMany.mockResolvedValue([{ openLibraryKey: "OL1W" }]);

    expect(await getExistingOpenLibraryKeys(USER_ID, ["OL1W", "OL2W"])).toEqual(["OL1W"]);
    expect(prismaMock.series.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, openLibraryKey: { in: ["OL1W", "OL2W"] } },
      select: { openLibraryKey: true },
    });
  });

  it("skips the query for no keys", async () => {
    expect(await getExistingOpenLibraryKeys(USER_ID, [])).toEqual([]);
    expect(prismaMock.series.findMany).not.toHaveBeenCalled();
  });
});

// ---- getFormatCounts ------------------------------------------------------

describe("getFormatCounts", () => {
  it("counts titles per format", async () => {
    prismaMock.series.groupBy.mockResolvedValue([
      { format: "MANGA", _count: { _all: 12 } },
      { format: "NOVEL", _count: { _all: 3 } },
    ]);

    expect(await getFormatCounts(USER_ID)).toEqual({ MANGA: 12, NOVEL: 3 });
    expect(prismaMock.series.groupBy).toHaveBeenCalledWith({
      by: ["format"],
      where: { userId: USER_ID },
      _count: { _all: true },
    });
  });
});
