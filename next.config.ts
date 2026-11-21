import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image (see Dockerfile).
  output: "standalone",
  // Sign-up and sign-in are the same email-code flow; kept so old links work.
  async redirects() {
    return [{ source: "/register", destination: "/login", permanent: true }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uploads.mangadex.org",
        pathname: "/covers/**",
      },
      // Cover-ID URLs only: Open Library rate-limits ISBN/OLID-keyed cover
      // URLs per IP, and every cover is fetched from this one server.
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
        pathname: "/b/id/**",
      },
      // Google Books thumbnails, for ISBNs Open Library doesn't know.
      {
        protocol: "https",
        hostname: "books.google.com",
        pathname: "/books/content",
      },
    ],
    // MangaDex cover URLs are content-addressed (a new cover gets a new file
    // name) and Open Library cover IDs are immutable, so optimized covers can
    // be cached for 30 days.
    minimumCacheTTL: 2_592_000,
  },
  experimental: {
    serverActions: {
      // Collection imports are sent as a Server Action argument; leave headroom
      // over MAX_IMPORT_SIZE (5 MB) in lib/import.ts. The default is 1 MB.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
