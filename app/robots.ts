import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // /login stays crawlable so crawlers can see its noindex tag.
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/health"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
