import type { Series } from "@/lib/generated/prisma/browser";
import { Format, SeriesStatus } from "@/lib/generated/prisma/enums";
import type { SeriesSchema } from "@/lib/validations";

export function getSeriesFormDefaults(series?: Series | null): SeriesSchema {
  return {
    title: series?.title ?? "",
    author: series?.author ?? "",
    publisherId: series?.publisherId ?? "",
    status: series?.status ?? SeriesStatus.READING,
    format: series?.format ?? Format.MANGA,
    publishing: series?.publishing ?? false,
    totalVolumes: series?.totalVolumes ?? null,
    retailPrice: series?.retailPrice ?? null,
    coverImage: series?.coverImage ?? "",
    description: series?.description ?? "",
    mangadexId: series?.mangadexId ?? null,
    openLibraryKey: series?.openLibraryKey ?? null,
  };
}
