import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

/**
 * Metadata for a public content page. Open Graph and Twitter are set in full
 * because a child's `openGraph` replaces the root layout's instead of merging,
 * which would otherwise leave these pages with the home page's URL or no image.
 */
export function contentMetadata({
  title,
  description,
  path,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
}): Metadata {
  const image = { url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME };
  const fullTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      type,
      siteName: SITE_NAME,
      locale: "en_US",
      images: [image],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [image] },
  };
}
