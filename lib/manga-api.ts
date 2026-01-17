// Jikan API - Unofficial MyAnimeList API
// Documentation: https://docs.api.jikan.moe/

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

export type MangaSearchResult = {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  volumes: number | null;
  chapters: number | null;
  status: string;
  publishing: boolean;
  synopsis: string | null;
  authors: Array<{
    mal_id: number;
    name: string;
  }>;
  serializations: Array<{
    mal_id: number;
    name: string;
  }>;
  genres: Array<{
    mal_id: number;
    name: string;
  }>;
  score: number | null;
};

export type MangaSearchResponse = {
  data: MangaSearchResult[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
  };
};

export type MangaExternalLink = {
  name: string;
  url: string;
};

export type MangaRelation = {
  relation: string;
  entry: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
};

export async function searchManga(query: string): Promise<MangaSearchResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `${JIKAN_BASE_URL}/manga?q=${encodeURIComponent(query)}&limit=10&sfw=true`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: MangaSearchResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error searching manga:", error);
    return [];
  }
}

export async function getMangaById(
  malId: number,
): Promise<MangaSearchResult | null> {
  try {
    const response = await fetch(`${JIKAN_BASE_URL}/manga/${malId}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching manga:", error);
    return null;
  }
}

// Get external links for a manga (useful for finding other sources)
export async function getMangaExternal(
  malId: number,
): Promise<MangaExternalLink[]> {
  try {
    const response = await fetch(`${JIKAN_BASE_URL}/manga/${malId}/external`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching manga external links:", error);
    return [];
  }
}

// Get related manga (prequels, sequels, spin-offs, etc.)
export async function getMangaRelations(
  malId: number,
): Promise<MangaRelation[]> {
  try {
    const response = await fetch(`${JIKAN_BASE_URL}/manga/${malId}/relations`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching manga relations:", error);
    return [];
  }
}

export type FormattedMangaData = {
  title: string;
  author: string | undefined;
  totalVolumes: number | undefined;
  coverImage: string;
  description: string | undefined;
  malId: number;
  publishing: boolean;
  status: string;
  genres: string[];
};

export function formatMangaForSeries(
  manga: MangaSearchResult,
): FormattedMangaData {
  return {
    title: manga.title_english || manga.title,
    author: manga.authors.map((a) => a.name).join(", ") || undefined,
    totalVolumes: manga.volumes || undefined,
    coverImage: manga.images.jpg.large_image_url || manga.images.jpg.image_url,
    description: manga.synopsis || undefined,
    malId: manga.mal_id,
    publishing: manga.publishing,
    status: manga.status,
    genres: manga.genres.map((g) => g.name),
  };
}

// Generate volume entries based on total volume count
// Since MAL doesn't have individual volume data, we create placeholder entries
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
