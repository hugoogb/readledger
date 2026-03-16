import { vi, beforeEach } from "vitest";
import { prismaMock } from "@/__tests__/__mocks__/prisma";
import { NotFoundError } from "@/lib/errors";
import {
  createSeries,
  createSeriesWithVolumes,
  updateSeries,
  deleteSeries,
  getAllSeries,
  getSeriesStats,
  checkDuplicateSeries,
  getExistingMangadexIds,
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
      publishing: true,
      totalVolumes: 17,
      publisherId: "pub-001",
    };
    const expected = makeSeries();
    prismaMock.series.create.mockResolvedValue(expected);

    const result = await createSeries(USER_ID, input);

    expect(result).toEqual(expected);
    expect(prismaMock.series.create).toHaveBeenCalledWith({
      data: {
        ...input,
        userId: USER_ID,
        publisherId: "pub-001",
      },
    });
  });

  it("sets publisherId to null when it is empty string", async () => {
    const input = {
      title: "Solo Leveling",
      status: "PLAN_TO_READ" as const,
      publishing: false,
      totalVolumes: null,
      publisherId: "",
    };
    const expected = makeSeries({ title: "Solo Leveling", publisherId: null });
    prismaMock.series.create.mockResolvedValue(expected);

    await createSeries(USER_ID, input);

    expect(prismaMock.series.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ publisherId: null }),
    });
  });
});

// ---- createSeriesWithVolumes ----------------------------------------------

describe("createSeriesWithVolumes", () => {
  it("creates a series with nested volumes", async () => {
    const input = {
      title: "Spy x Family",
      status: "READING" as const,
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

    const result = await createSeriesWithVolumes(USER_ID, input, volumes);

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
      publishing: true,
      totalVolumes: 5,
    };
    const volumes = [
      { volumeNumber: 1 },
      { volumeNumber: 2, coverImage: "" },
    ];
    const expected = makeSeries({ title: "Jujutsu Kaisen" });
    prismaMock.series.create.mockResolvedValue(expected);

    await createSeriesWithVolumes(USER_ID, input, volumes);

    const call = prismaMock.series.create.mock.calls[0][0];
    expect(call.data.volumes.create[0].coverImage).toBeNull();
    expect(call.data.volumes.create[1].coverImage).toBeNull();
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
      include: { volumes: true },
    });
    expect(prismaMock.series.update).toHaveBeenCalledWith({
      where: { id: SERIES_ID },
      data: expect.objectContaining({ title: "Chainsaw Man Part 2" }),
    });
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
      include: { publisher: true, volumes: true },
      orderBy: { updatedAt: "desc" },
    });
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

    const result = await getAllSeries(USER_ID, undefined, "completion");

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

    const result = await getAllSeries(USER_ID, undefined, "spent");

    expect(result[0].id).toBe("series-high");
    expect(result[1].id).toBe("series-low");
  });
});

// ---- getSeriesStats -------------------------------------------------------

describe("getSeriesStats", () => {
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

// ---- checkDuplicateSeries -------------------------------------------------

describe("checkDuplicateSeries", () => {
  it("returns true when a duplicate exists and false when not", async () => {
    prismaMock.series.findFirst.mockResolvedValue(makeSeries());
    expect(await checkDuplicateSeries(USER_ID, "mdx-001")).toBe(true);

    prismaMock.series.findFirst.mockResolvedValue(null);
    expect(await checkDuplicateSeries(USER_ID, "mdx-999")).toBe(false);
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
