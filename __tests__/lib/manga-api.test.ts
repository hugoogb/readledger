import { describe, it, expect } from "vitest";
import {
  formatMangaForSeries,
  generateVolumeEntries,
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
