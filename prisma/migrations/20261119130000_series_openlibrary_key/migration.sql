-- AlterTable: titles added from Open Library remember their work key.
ALTER TABLE "series" ADD COLUMN "openLibraryKey" TEXT;

-- CreateIndex: one entry per Open Library work per user, like mangadexId.
-- NULLs are distinct in Postgres, so manual and MangaDex titles are unaffected.
CREATE UNIQUE INDEX "series_userId_openLibraryKey_key" ON "series"("userId", "openLibraryKey");
