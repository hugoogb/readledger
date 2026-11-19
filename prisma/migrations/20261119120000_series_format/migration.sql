-- CreateEnum
CREATE TYPE "Format" AS ENUM ('MANGA', 'LIGHT_NOVEL', 'COMIC', 'NOVEL', 'NONFICTION', 'OTHER');

-- AlterTable: every existing title is manga, which the default backfills.
ALTER TABLE "series" ADD COLUMN "format" "Format" NOT NULL DEFAULT 'MANGA';

-- Data: a title with totalVolumes = 1 renders as a standalone book, which needs
-- its single volume row. Create volume 1 for any such title that has none, so
-- the app never has to write while rendering.
INSERT INTO "volumes" ("id", "seriesId", "volumeNumber", "owned", "read", "wishlist", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, s."id", 1, false, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "series" s
WHERE s."totalVolumes" = 1
  AND NOT EXISTS (SELECT 1 FROM "volumes" v WHERE v."seriesId" = s."id");
