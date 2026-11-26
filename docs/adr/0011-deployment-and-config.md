# 0011. Deployment and config

Status: accepted

### Optimised covers are cached for 30 days

Where: `next.config.ts` (`images.minimumCacheTTL`)

MangaDex cover URLs are content-addressed, so a new cover gets a new file name, and Open Library cover IDs are immutable. Optimised covers can therefore be cached for 30 days without going stale.

### Health check requires the database

Where: `app/health/route.ts` (`GET`)

The route backs the container HEALTHCHECK and `docker compose up --wait`. It answers 200 only when a `SELECT 1` succeeds, so a deploy that cannot reach Postgres fails.

### IBM Plex Sans is self-hosted

Where: `app/layout.tsx` (`plexSans`)

IBM Plex Sans is loaded from a self-hosted latin subset from Fontsource (OFL) with `next/font/local`, because Turbopack's `next/font/google` cannot resolve its font file URLs.
