import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ReadLedger",
    short_name: "ReadLedger",
    description: "Track your manga collection, reading progress, and spending.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f8f8fc",
    theme_color: "#f8f8fc",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
