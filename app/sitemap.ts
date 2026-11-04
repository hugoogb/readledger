import type { MetadataRoute } from "next";
import { guides } from "@/content/guides";
import { MANGA_DATA_CHECKED_ON, mangaSeries } from "@/lib/content/manga-series";
import { SITE_URL } from "@/lib/site";

// Indexable pages only. lastModified comes from content dates, never from the
// build: search engines learn to ignore dates that change on every deploy.
export default function sitemap(): MetadataRoute.Sitemap {
  const latestGuide = guides.map((guide) => guide.updated).sort().at(-1);

  return [
    { url: `${SITE_URL}/` },
    { url: `${SITE_URL}/manga`, lastModified: MANGA_DATA_CHECKED_ON },
    ...mangaSeries.map((series) => ({
      url: `${SITE_URL}/manga/${series.slug}`,
      lastModified: MANGA_DATA_CHECKED_ON,
    })),
    { url: `${SITE_URL}/guides`, lastModified: latestGuide },
    ...guides.map((guide) => ({
      url: `${SITE_URL}/guides/${guide.slug}`,
      lastModified: guide.updated,
    })),
  ];
}
