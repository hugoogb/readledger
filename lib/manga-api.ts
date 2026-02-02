// MangaDex API
// Documentation: https://api.mangadex.org/docs/

import { throttleMangadex } from "./rate-limit";

const MANGADEX_BASE_URL = "https://api.mangadex.org";

// --- Raw MangaDex response types ---

type MangaDexMangaResponse = {
  result: string;
  response: string;
  data: MangaDexManga[];
  limit: number;
  offset: number;
  total: number;
};

type MangaDexManga = {
  id: string;
  type: string;
  attributes: {
    title: Record<string, string>;
    altTitles: Record<string, string>[];
    description: Record<string, string>;
    links: Record<string, string> | null;
    originalLanguage: string;
    lastVolume: string | null;
    lastChapter: string | null;
    publicationDemographic: string | null;
    status: string;
    year: number | null;
    contentRating: string;
    tags: Array<{
      id: string;
      type: string;
      attributes: {
        name: Record<string, string>;
        group: string;
      };
    }>;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: Record<string, unknown>;
  }>;
};

type MangaDexAggregateResponse = {
  result: string;
  volumes: Record<string, { volume: string; count: number }>;
};

type MangaDexStatisticsResponse = {
  result: string;
  statistics: Record<
    string,
    {
      rating: {
        average: number | null;
        bayesian: number;
      };
      follows: number;
    }
  >;
};

type MangaDexCoverResponse = {
  result: string;
  data: Array<{
    id: string;
    attributes: {
      volume: string | null;
      fileName: string;
    };
    relationships: Array<{
      id: string;
      type: string;
    }>;
  }>;
  total: number;
  limit: number;
  offset: number;
};

// --- Normalized app types ---

export type MangaSearchResult = {
  id: string;
  title: string;
  titleJapanese: string | null;
  coverImage: string;
  coverImageSmall: string;
  lastVolume: number | null;
  status: string;
  year: number | null;
  description: string | null;
  authors: string[];
  genres: Array<{ id: string; name: string }>;
  score: number | null;
  demographic: string | null;
};

export type PaginatedSearchResult = {
  data: MangaSearchResult[];
  pagination: {
    lastVisiblePage: number;
    hasNextPage: boolean;
    currentPage: number;
  };
};

export type VolumeData = {
  volumeNumber: number;
  title: string;
  coverImage: string | null;
  isbn: string | null;
};

export type FormattedMangaData = {
  mangadexId: string;
  title: string;
  titleJapanese: string | null;
  author: string | undefined;
  totalVolumes: number | undefined;
  coverImage: string;
  description: string | undefined;
  publishing: boolean;
  status: string;
  year: number | null;
  genres: string[];
};

// --- Helper functions ---

function extractTitle(manga: MangaDexManga): string {
  const titles = manga.attributes.title;
  return titles.en || titles["ja-ro"] || Object.values(titles)[0] || "Unknown";
}

function extractJapaneseTitle(manga: MangaDexManga): string | null {
  // Check altTitles for Japanese
  for (const alt of manga.attributes.altTitles) {
    if (alt.ja) return alt.ja;
  }
  // Check main title
  if (manga.attributes.title.ja) return manga.attributes.title.ja;
  return null;
}

function extractAuthors(manga: MangaDexManga): string[] {
  return manga.relationships
    .filter((r) => r.type === "author" || r.type === "artist")
    .map((r) => (r.attributes?.name as string) || "")
    .filter(Boolean)
    .filter((name, i, arr) => arr.indexOf(name) === i); // dedupe
}

function extractCoverFileName(manga: MangaDexManga): string | null {
  const coverRel = manga.relationships.find((r) => r.type === "cover_art");
  if (coverRel?.attributes?.fileName) {
    return coverRel.attributes.fileName as string;
  }
  return null;
}

function buildCoverUrl(mangaId: string, fileName: string | null): string {
  if (!fileName) return "";
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
}

function buildCoverUrlSmall(
  mangaId: string,
  fileName: string | null,
): string {
  if (!fileName) return "";
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}.256.jpg`;
}

function extractGenres(
  manga: MangaDexManga,
): Array<{ id: string; name: string }> {
  return manga.attributes.tags
    .filter((t) => t.attributes.group === "genre" || t.attributes.group === "theme")
    .map((t) => ({
      id: t.id,
      name: t.attributes.name.en || Object.values(t.attributes.name)[0] || "",
    }))
    .filter((g) => g.name);
}

function parseMangaDexManga(manga: MangaDexManga): MangaSearchResult {
  const coverFileName = extractCoverFileName(manga);
  const lastVol = manga.attributes.lastVolume;

  return {
    id: manga.id,
    title: extractTitle(manga),
    titleJapanese: extractJapaneseTitle(manga),
    coverImage: buildCoverUrl(manga.id, coverFileName),
    coverImageSmall: buildCoverUrlSmall(manga.id, coverFileName),
    lastVolume: lastVol ? parseInt(lastVol, 10) || null : null,
    status: manga.attributes.status,
    year: manga.attributes.year,
    description:
      manga.attributes.description.en ||
      Object.values(manga.attributes.description)[0] ||
      null,
    authors: extractAuthors(manga),
    genres: extractGenres(manga),
    score: null, // filled in separately via statistics endpoint
    demographic: manga.attributes.publicationDemographic,
  };
}

async function fetchLastVolume(mangadexId: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${MANGADEX_BASE_URL}/manga/${mangadexId}/aggregate`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data: MangaDexAggregateResponse = await res.json();
    const volumeNumbers = Object.keys(data.volumes)
      .filter((key) => key !== "none")
      .map(Number)
      .filter((n) => !isNaN(n));
    return volumeNumbers.length > 0 ? Math.max(...volumeNumbers) : null;
  } catch {
    return null;
  }
}

// --- API functions ---

const PAGE_SIZE = 10;

export async function searchMangaPaginated(
  query: string,
  page: number = 1,
): Promise<PaginatedSearchResult> {
  if (!query || query.length < 2) {
    return {
      data: [],
      pagination: { lastVisiblePage: 1, hasNextPage: false, currentPage: 1 },
    };
  }

  try {
    const offset = (page - 1) * PAGE_SIZE;
    const params = new URLSearchParams({
      title: query,
      limit: String(PAGE_SIZE),
      offset: String(offset),
      "order[relevance]": "desc",
    });
    // Array params
    for (const rating of ["safe", "suggestive", "erotica"]) {
      params.append("contentRating[]", rating);
    }
    for (const include of ["cover_art", "author", "artist"]) {
      params.append("includes[]", include);
    }

    await throttleMangadex();
    const response = await fetch(`${MANGADEX_BASE_URL}/manga?${params}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`MangaDex API error: ${response.status}`);
    }

    const raw: MangaDexMangaResponse = await response.json();
    const results = raw.data.map(parseMangaDexManga);

    // Resolve lastVolume for manga where it's missing via aggregate endpoint
    const aggregatePromises = results.map(async (r) => {
      if (r.lastVolume === null) {
        r.lastVolume = await fetchLastVolume(r.id);
      }
    });

    // Batch-fetch statistics for all results
    const statsPromise = (async () => {
      if (results.length === 0) return;
      const statsParams = new URLSearchParams();
      for (const r of results) {
        statsParams.append("manga[]", r.id);
      }

      try {
        const statsRes = await fetch(
          `${MANGADEX_BASE_URL}/statistics/manga?${statsParams}`,
          { headers: { Accept: "application/json" } },
        );

        if (statsRes.ok) {
          const statsData: MangaDexStatisticsResponse = await statsRes.json();
          for (const result of results) {
            const stats = statsData.statistics[result.id];
            if (stats?.rating) {
              result.score = stats.rating.bayesian
                ? Math.round(stats.rating.bayesian * 10) / 10
                : null;
            }
          }
        }
      } catch {
        // Statistics are optional — continue without scores
      }
    })();

    // Run aggregate and stats fetches in parallel
    await Promise.all([...aggregatePromises, statsPromise]);

    const totalPages = Math.max(1, Math.ceil(raw.total / PAGE_SIZE));

    return {
      data: results,
      pagination: {
        lastVisiblePage: totalPages,
        hasNextPage: page < totalPages,
        currentPage: page,
      },
    };
  } catch (error) {
    console.error("Error searching manga:", error);
    return {
      data: [],
      pagination: { lastVisiblePage: 1, hasNextPage: false, currentPage: 1 },
    };
  }
}

export function formatMangaForSeries(
  manga: MangaSearchResult,
): FormattedMangaData {
  return {
    mangadexId: manga.id,
    title: manga.title,
    titleJapanese: manga.titleJapanese,
    author: manga.authors.join(", ") || undefined,
    totalVolumes: manga.lastVolume || undefined,
    coverImage: manga.coverImage,
    description: manga.description || undefined,
    publishing: manga.status === "ongoing",
    status: manga.status,
    year: manga.year,
    genres: manga.genres.map((g) => g.name),
  };
}

// Fetch per-volume cover images from MangaDex
export async function fetchVolumeCovers(
  mangadexId: string,
  totalVolumes: number,
  onProgress?: (fetched: number, total: number) => void,
): Promise<VolumeData[]> {
  try {
    const coverMap = await fetchMangaDexCovers(mangadexId, totalVolumes, onProgress);
    if (coverMap.size === 0) {
      return generatePlaceholderVolumes(totalVolumes);
    }

    return Array.from({ length: totalVolumes }, (_, i) => {
      const volNum = i + 1;
      return {
        volumeNumber: volNum,
        title: `Volume ${volNum}`,
        coverImage: coverMap.get(String(volNum)) || null,
        isbn: null,
      };
    });
  } catch (error) {
    console.error("Error fetching volume covers from MangaDex:", error);
    return generatePlaceholderVolumes(totalVolumes);
  }
}

async function fetchMangaDexCovers(
  mangaId: string,
  totalVolumes: number,
  onProgress?: (fetched: number, total: number) => void,
): Promise<Map<string, string>> {
  const coverMap = new Map<string, string>();
  let offset = 0;
  const limit = 100;

  while (offset === 0 || offset < totalVolumes) {
    try {
      await throttleMangadex();
      const response = await fetch(
        `${MANGADEX_BASE_URL}/cover?manga[]=${mangaId}&limit=${limit}&offset=${offset}&order[volume]=asc`,
        { headers: { Accept: "application/json" } },
      );

      if (!response.ok) break;

      const data: MangaDexCoverResponse = await response.json();

      for (const cover of data.data) {
        const volume = cover.attributes.volume;
        if (volume && !coverMap.has(volume)) {
          const coverUrl = `https://uploads.mangadex.org/covers/${mangaId}/${cover.attributes.fileName}.256.jpg`;
          coverMap.set(volume, coverUrl);
        }
      }

      onProgress?.(coverMap.size, totalVolumes);

      if (data.data.length < limit) break;
      offset += limit;
    } catch {
      break;
    }
  }

  return coverMap;
}

function generatePlaceholderVolumes(totalVolumes: number): VolumeData[] {
  return Array.from({ length: totalVolumes }, (_, i) => ({
    volumeNumber: i + 1,
    title: `Volume ${i + 1}`,
    coverImage: null,
    isbn: null,
  }));
}

export function generateVolumeEntries(totalVolumes: number): Array<{
  volumeNumber: number;
  title: string;
}> {
  if (!totalVolumes || totalVolumes <= 0) {
    return [];
  }

  return Array.from({ length: totalVolumes }, (_, i) => ({
    volumeNumber: i + 1,
    title: `Volume ${i + 1}`,
  }));
}
