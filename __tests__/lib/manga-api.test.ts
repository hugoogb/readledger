import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/rate-limit", () => ({ throttleMangadex: vi.fn(async () => {}) }));

import {
  formatMangaForSeries,
  findTopManga,
  generateVolumeEntries,
  searchMangaPaginated,
  type MangaSearchResult,
} from "@/lib/manga-api";

describe("formatMangaForSeries", () => {
  const mockManga: MangaSearchResult = {
    id: "abc-123",
    title: "One Piece",
    titleJapanese: "ワンピース",
    coverImage: "https://uploads.mangadex.org/covers/abc-123/cover.jpg",
    coverImageSmall:
      "https://uploads.mangadex.org/covers/abc-123/cover.jpg.256.jpg",
    lastVolume: 109,
    status: "ongoing",
    year: 1997,
    description: "A pirate adventure",
    authors: ["Eiichiro Oda"],
    genres: [
      { id: "g1", name: "Adventure" },
      { id: "g2", name: "Action" },
    ],
    score: 9.1,
    demographic: "shounen",
    altTitles: [],
  };

  it("maps manga to series format", () => {
    const result = formatMangaForSeries(mockManga);
    expect(result).toEqual({
      mangadexId: "abc-123",
      title: "One Piece",
      titleJapanese: "ワンピース",
      author: "Eiichiro Oda",
      totalVolumes: 109,
      coverImage: "https://uploads.mangadex.org/covers/abc-123/cover.jpg",
      description: "A pirate adventure",
      publishing: true,
      status: "ongoing",
      year: 1997,
      genres: ["Adventure", "Action"],
    });
  });

  it("sets publishing to false for completed manga", () => {
    const completed = { ...mockManga, status: "completed" };
    const result = formatMangaForSeries(completed);
    expect(result.publishing).toBe(false);
  });

  it("handles missing authors", () => {
    const noAuthors = { ...mockManga, authors: [] };
    const result = formatMangaForSeries(noAuthors);
    expect(result.author).toBeUndefined();
  });

  it("handles null lastVolume", () => {
    const noVolumes = { ...mockManga, lastVolume: null };
    const result = formatMangaForSeries(noVolumes);
    expect(result.totalVolumes).toBeUndefined();
  });

  it("handles null description", () => {
    const noDesc = { ...mockManga, description: null };
    const result = formatMangaForSeries(noDesc);
    expect(result.description).toBeUndefined();
  });

  it("joins multiple authors", () => {
    const multiAuthor = {
      ...mockManga,
      authors: ["Author 1", "Author 2"],
    };
    const result = formatMangaForSeries(multiAuthor);
    expect(result.author).toBe("Author 1, Author 2");
  });
});

describe("generateVolumeEntries", () => {
  it("generates correct number of entries", () => {
    const result = generateVolumeEntries(5);
    expect(result).toHaveLength(5);
  });

  it("generates sequential volume numbers starting at 1", () => {
    const result = generateVolumeEntries(3);
    expect(result[0]).toEqual({ volumeNumber: 1, title: "Volume 1" });
    expect(result[1]).toEqual({ volumeNumber: 2, title: "Volume 2" });
    expect(result[2]).toEqual({ volumeNumber: 3, title: "Volume 3" });
  });

  it("returns empty array for 0", () => {
    expect(generateVolumeEntries(0)).toEqual([]);
  });

  it("returns empty array for negative number", () => {
    expect(generateVolumeEntries(-1)).toEqual([]);
  });
});

describe("searchMangaPaginated", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps every alt title, in any language", async () => {
    const manga = {
      id: "ds-1",
      type: "manga",
      attributes: {
        title: { en: "Demon Slayer: Kimetsu no Yaiba" },
        altTitles: [{ es: "Guardianes de la noche" }, { ja: "鬼滅の刃" }],
        description: {},
        links: null,
        originalLanguage: "ja",
        lastVolume: "23",
        lastChapter: null,
        publicationDemographic: null,
        status: "completed",
        year: 2016,
        contentRating: "safe",
        tags: [],
      },
      relationships: [],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => ({
        ok: !url.includes("/statistics/"),
        json: async () => ({ data: [manga], total: 1, limit: 10, offset: 0 }),
      })),
    );

    const page = await searchMangaPaginated("guardianes alt titles", 1);

    expect(page.data[0].altTitles).toEqual(["Guardianes de la noche", "鬼滅の刃"]);
  });
});

describe("findTopManga", () => {
  afterEach(() => vi.unstubAllGlobals());

  const raw = (lastVolume: string | null) => ({
    id: "md-9",
    type: "manga",
    attributes: {
      title: { en: "Dr. Slump" },
      altTitles: [],
      description: {},
      links: null,
      originalLanguage: "ja",
      lastVolume,
      lastChapter: null,
      publicationDemographic: null,
      status: "completed",
      year: 1980,
      contentRating: "safe",
      tags: [],
    },
    relationships: [],
  });

  it("asks for one result and skips the statistics request", async () => {
    const fetchMock = vi.fn<(url: string) => Promise<unknown>>(async () => ({
      ok: true,
      json: async () => ({ data: [raw("18")], total: 1 }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const manga = await findTopManga("dr slump top");

    expect(manga?.lastVolume).toBe(18);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get("limit")).toBe("1");
  });

  it("returns null when nothing matches", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ data: [], total: 0 }) })));
    expect(await findTopManga("nothing here")).toBeNull();
  });
});
