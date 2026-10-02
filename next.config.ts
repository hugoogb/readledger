import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image (see Dockerfile).
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uploads.mangadex.org",
        pathname: "/covers/**",
      },
    ],
    // MangaDex cover URLs are content-addressed (a new cover gets a new file
    // name), so optimized covers can be cached for 30 days.
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
