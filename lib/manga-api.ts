// MangaDex API
// Documentation: https://api.mangadex.org/docs/

import { TTLCache } from "./cache";
import { logger } from "./logger";
import { errorMessage } from "./utils";
import { throttleMangadex } from "./rate-limit";

const MANGADEX_BASE_URL = "https://api.mangadex.org";
const MANGADEX_TIMEOUT_MS = 10_000;

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
  /** Every alt title, any language (e.g. Spanish names used to match scans). */
  altTitles: string[];
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
  return (coverRel?.attributes?.fileName as string | undefined) ?? null;
}

/** Full-size cover URL, or the 256px thumbnail with `small`. */
function coverUrl(mangaId: string, fileName: string | null, small = false): string {
  if (!fileName) return "";
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}${small ? ".256.jpg" : ""}`;
}

/** GET a MangaDex endpoint; null on a non-OK response. */
async function mangadexGet<T>(path: string): Promise<T | null> {
  const res = await fetch(`${MANGADEX_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(MANGADEX_TIMEOUT_MS),
  });
  return res.ok ? ((await res.json()) as T) : null;
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
    coverImage: coverUrl(manga.id, coverFileName),
    coverImageSmall: coverUrl(manga.id, coverFileName, true),
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
    altTitles: manga.attributes.altTitles.flatMap((alt) => Object.values(alt)),
  };
}

async function fetchLastVolume(mangadexId: string): Promise<number | null> {
  try {
    const data = await mangadexGet<MangaDexAggregateResponse>(`/manga/${mangadexId}/aggregate`);
    if (!data) return null;
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

function mangaSearchParams(query: string, limit: number, offset: number): URLSearchParams {
  const params = new URLSearchParams({
    title: query,
    limit: String(limit),
    offset: String(offset),
    "order[relevance]": "desc",
  });
  for (const rating of ["safe", "suggestive", "erotica"]) {
    params.append("contentRating[]", rating);
  }
  for (const include of ["cover_art", "author", "artist"]) {
    params.append("includes[]", include);
  }
  return params;
}

/**
 * The single most relevant manga for a title (alt titles included), or null.
 * Lighter than a search page: one result, no statistics. Used to match scans.
 */
export async function findTopManga(title: string): Promise<MangaSearchResult | null> {
  try {
    await throttleMangadex();
    const raw = await mangadexGet<MangaDexMangaResponse>(`/manga?${mangaSearchParams(title, 1, 0)}`);
    if (!raw) throw new Error("MangaDex API error");
    const top = raw.data[0] ? parseMangaDexManga(raw.data[0]) : null;
    if (top && top.lastVolume === null) top.lastVolume = await fetchLastVolume(top.id);
    return top;
  } catch (error) {
    logger.error("Error finding manga", { error: errorMessage(error) });
    return null;
  }
}

const PAGE_SIZE = 10;
const searchCache = new TTLCache<PaginatedSearchResult>(60_000); // 1 min TTL

const emptyPage = (): PaginatedSearchResult => ({
  data: [],
  pagination: { lastVisiblePage: 1, hasNextPage: false, currentPage: 1 },
});

export async function searchMangaPaginated(
  query: string,
  page: number = 1,
): Promise<PaginatedSearchResult> {
  if (!query || query.length < 2) return emptyPage();

  const cacheKey = `${query}:${page}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  try {
    await throttleMangadex();
    const raw = await mangadexGet<MangaDexMangaResponse>(
      `/manga?${mangaSearchParams(query, PAGE_SIZE, (page - 1) * PAGE_SIZE)}`,
    );
    if (!raw) throw new Error("MangaDex API error");
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
        const statsData = await mangadexGet<MangaDexStatisticsResponse>(`/statistics/manga?${statsParams}`);
        if (!statsData) return;
        for (const result of results) {
          const stats = statsData.statistics[result.id];
          if (stats?.rating) {
            result.score = stats.rating.bayesian
              ? Math.round(stats.rating.bayesian * 10) / 10
              : null;
          }
        }
      } catch {
        // Statistics are optional — continue without scores
      }
    })();

    // Run aggregate and stats fetches in parallel
    await Promise.all([...aggregatePromises, statsPromise]);

    const totalPages = Math.max(1, Math.ceil(raw.total / PAGE_SIZE));

    const result: PaginatedSearchResult = {
      data: results,
      pagination: {
        lastVisiblePage: totalPages,
        hasNextPage: page < totalPages,
        currentPage: page,
      },
    };

    searchCache.set(cacheKey, result);
    return result;
  } catch (error) {
    logger.error("Error searching manga", { error: errorMessage(error) });
    return emptyPage();
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

/** Volume rows 1..total with no covers. */
export function placeholderVolumes(totalVolumes: number): VolumeData[] {
  return Array.from({ length: Math.max(0, totalVolumes) }, (_, i) => ({
    volumeNumber: i + 1,
    title: `Volume ${i + 1}`,
    coverImage: null,
    isbn: null,
  }));
}

/** Volume rows 1..total with each volume's MangaDex cover where there is one. */
export async function fetchVolumeCovers(
  mangadexId: string,
  totalVolumes: number,
): Promise<VolumeData[]> {
  const coverMap = await fetchMangaDexCovers(mangadexId, totalVolumes);
  return placeholderVolumes(totalVolumes).map((v) => ({
    ...v,
    coverImage: coverMap.get(String(v.volumeNumber)) ?? null,
  }));
}

/** Cover thumbnail per volume ("1", "2"...); stops quietly at the first failure. */
async function fetchMangaDexCovers(mangaId: string, totalVolumes: number): Promise<Map<string, string>> {
  const coverMap = new Map<string, string>();
  let offset = 0;
  const limit = 100;

  while (offset === 0 || offset < totalVolumes) {
    try {
      await throttleMangadex();
      const data = await mangadexGet<MangaDexCoverResponse>(
        `/cover?manga[]=${mangaId}&limit=${limit}&offset=${offset}&order[volume]=asc`,
      );
      if (!data) break;

      for (const cover of data.data) {
        const volume = cover.attributes.volume;
        if (volume && !coverMap.has(volume)) {
          coverMap.set(volume, coverUrl(mangaId, cover.attributes.fileName, true));
        }
      }

      if (data.data.length < limit) break;
      offset += limit;
    } catch (error) {
      logger.error("Error fetching volume covers from MangaDex", { error: errorMessage(error) });
      break;
    }
  }

  return coverMap;
}
