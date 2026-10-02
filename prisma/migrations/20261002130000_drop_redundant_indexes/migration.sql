-- Each of these single-column indexes duplicates another index or is covered
-- by a unique index that starts with the same column, so Postgres can use
-- that one for the same lookups (including the ON DELETE CASCADE from series
-- to volumes). Dropping them saves a write per index on every insert/update.

-- series(userId): duplicated twice, and covered by series_userId_mangadexId_key.
DROP INDEX IF EXISTS "series_userId_idx";
DROP INDEX IF EXISTS "idx_series_userid";

-- volumes(seriesId): duplicated twice, and covered by volumes_seriesId_volumeNumber_key.
DROP INDEX IF EXISTS "volumes_seriesId_idx";
DROP INDEX IF EXISTS "idx_volumes_seriesid";

-- publishers/user_stores(userId): covered by the (userId, name) unique keys.
DROP INDEX IF EXISTS "publishers_userId_idx";
DROP INDEX IF EXISTS "user_stores_userId_idx";
