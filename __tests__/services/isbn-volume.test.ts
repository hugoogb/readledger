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

  it("fills the gap rows when the scan is past the end, like editing the total does", async () => {
    prismaMock.series.findFirst.mockResolvedValue({ id: "s1", totalVolumes: 10 });
    prismaMock.volume.findFirst.mockResolvedValue(null);

    await markVolumeOwnedByIsbn("user-1", "s1", 13, ISBN);

    expect(prismaMock.volume.createMany).toHaveBeenCalledWith({
      data: [
        { seriesId: "s1", volumeNumber: 11 },
        { seriesId: "s1", volumeNumber: 12 },
      ],
      skipDuplicates: true,
    });
    expect(prismaMock.series.update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { totalVolumes: 13 } });
  });

  it("rejects another user's series", async () => {
    prismaMock.series.findFirst.mockResolvedValue(null);
    await expect(markVolumeOwnedByIsbn("user-2", "s1", 3, ISBN)).rejects.toBeInstanceOf(NotFoundError);
    expect(prismaMock.volume.update).not.toHaveBeenCalled();
  });
});

// --- resolveIsbnVolume ---

vi.mock("@/lib/isbn-lookup", () => ({ lookupIsbnAnySource: vi.fn() }));
vi.mock("@/lib/manga-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/manga-api")>()),
  searchMangaPaginated: vi.fn(),
}));

import { lookupIsbnAnySource } from "@/lib/isbn-lookup";
import { searchMangaPaginated, type MangaSearchResult } from "@/lib/manga-api";
import type { BookSearchResult } from "@/lib/openlibrary-api";
import { resolveIsbnVolume } from "@/services/isbn-volume";

const bookTitled = (title: string) => ({ key: "k", title, source: "openlibrary" }) as BookSearchResult;

const manga = (overrides: Partial<MangaSearchResult> = {}): MangaSearchResult => ({
  id: "md-1",
  title: "Dr. Slump",
  titleJapanese: null,
  coverImage: "https://uploads.mangadex.org/covers/md-1/c.jpg",
  coverImageSmall: "https://uploads.mangadex.org/covers/md-1/c.jpg.256.jpg",
  lastVolume: 18,
  status: "completed",
  year: 1980,
  description: null,
  authors: ["Akira Toriyama"],
  genres: [],
  score: null,
  demographic: null,
  altTitles: [],
  ...overrides,
});

const mangaPage = (...data: MangaSearchResult[]) => ({
  data,
  pagination: { lastVisiblePage: 1, hasNextPage: false, currentPage: 1 },
});

describe("resolveIsbnVolume", () => {
  beforeEach(() => {
    prismaMock.volume.findFirst.mockResolvedValue(null);
    prismaMock.series.findMany.mockResolvedValue([]);
  });

  it("returns the known volume before any network lookup", async () => {
    prismaMock.volume.findFirst.mockResolvedValue({
      seriesId: "s1",
      volumeNumber: 3,
      owned: true,
      series: { title: "One Piece" },
    });

    expect(await resolveIsbnVolume("user-1", ISBN)).toEqual({
      kind: "existing",
      seriesId: "s1",
      seriesTitle: "One Piece",
      volumeNumber: 3,
      owned: true,
      isbn: ISBN,
      byIsbn: true,
    });
    expect(lookupIsbnAnySource).not.toHaveBeenCalled();
  });

  it("matches a library series by title", async () => {
    vi.mocked(lookupIsbnAnySource).mockResolvedValue(bookTitled("ONE PIECE 3"));
    prismaMock.series.findMany.mockResolvedValue([
      { id: "s1", title: "One Piece", totalVolumes: 110, _count: { volumes: 110 } },
    ]);

    expect(await resolveIsbnVolume("user-1", ISBN)).toEqual({
      kind: "existing",
      seriesId: "s1",
      seriesTitle: "One Piece",
      volumeNumber: 3,
      owned: false,
      isbn: ISBN,
      byIsbn: false,
    });
    expect(searchMangaPaginated).not.toHaveBeenCalled();
  });

  it("falls back to the edition title when the work title has no volume number", async () => {
    vi.mocked(lookupIsbnAnySource).mockResolvedValue({
      ...bookTitled("ONE PIECE"),
      editionTitle: "ONE PIECE 3",
    });
    prismaMock.series.findMany.mockResolvedValue([
      { id: "s1", title: "One Piece", totalVolumes: 110, _count: { volumes: 110 } },
    ]);

    expect(await resolveIsbnVolume("user-1", ISBN)).toMatchObject({ kind: "existing", seriesId: "s1", volumeNumber: 3 });
  });

  it("trusts the work title over a wrong edition title", async () => {
    vi.mocked(lookupIsbnAnySource).mockResolvedValue({ ...bookTitled("ONE PIECE 3"), editionTitle: "Evidencia" });
    prismaMock.series.findMany.mockResolvedValue([
      { id: "s1", title: "One Piece", totalVolumes: 110, _count: { volumes: 110 } },
    ]);

    expect(await resolveIsbnVolume("user-1", ISBN)).toMatchObject({ kind: "existing", volumeNumber: 3 });
  });

  it("matches via MangaDex alt titles", async () => {
    vi.mocked(lookupIsbnAnySource).mockResolvedValue(bookTitled("Guardianes de la noche 23"));
    vi.mocked(searchMangaPaginated).mockResolvedValue(
      mangaPage(manga({ id: "ds-1", title: "Demon Slayer: Kimetsu no Yaiba", altTitles: ["Guardianes de la noche"] })),
    );
    prismaMock.series.findMany.mockImplementation(async (args: { where: { mangadexId?: unknown } }) =>
      args.where.mangadexId
        ? [{ id: "s9", mangadexId: "ds-1", title: "Demon Slayer", totalVolumes: 23, _count: { volumes: 23 } }]
        : [],
    );
    prismaMock.volume.findFirst.mockImplementation(async (args: { where: { seriesId?: string } }) =>
      args.where.seriesId ? { owned: false } : null,
    );

    expect(await resolveIsbnVolume("user-1", ISBN)).toMatchObject({
      kind: "existing",
      seriesId: "s9",
      seriesTitle: "Demon Slayer",
      volumeNumber: 23,
      owned: false,
    });
  });

  it("suggests a new series from MangaDex", async () => {
    vi.mocked(lookupIsbnAnySource).mockResolvedValue(bookTitled("Dr. Slump nº 11"));
    vi.mocked(searchMangaPaginated).mockResolvedValue(mangaPage(manga()));

    const match = await resolveIsbnVolume("user-1", ISBN);

    expect(match).toMatchObject({ kind: "new", volumeNumber: 11, totalVolumes: 18, useMangadexCovers: true });
    expect(match?.kind === "new" && match.manga.mangadexId).toBe("md-1");
  });

  it("uses the printed total and drops MangaDex covers when totals differ", async () => {
    vi.mocked(lookupIsbnAnySource).mockResolvedValue(bookTitled("Dr. Slump nº 11/15"));
    vi.mocked(searchMangaPaginated).mockResolvedValue(mangaPage(manga()));

    expect(await resolveIsbnVolume("user-1", ISBN)).toMatchObject({
      kind: "new",
      volumeNumber: 11,
      totalVolumes: 15,
      useMangadexCovers: false,
    });
  });

  it("bare trailing number without a series match returns null", async () => {
    vi.mocked(lookupIsbnAnySource).mockResolvedValue(bookTitled("Fahrenheit 451"));
    vi.mocked(searchMangaPaginated).mockResolvedValue(mangaPage(manga({ title: "Fahrenheit 0" })));

    expect(await resolveIsbnVolume("user-1", ISBN)).toBeNull();
  });

  it("returns null when the lookup throws", async () => {
    vi.mocked(lookupIsbnAnySource).mockRejectedValue(new Error("down"));
    expect(await resolveIsbnVolume("user-1", ISBN)).toBeNull();
  });
});
