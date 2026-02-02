/*
  Warnings:

  - You are about to drop the column `malId` on the `series` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,mangadexId]` on the table `series` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "series_userId_malId_key";

-- AlterTable
ALTER TABLE "series" DROP COLUMN "malId",
ADD COLUMN     "mangadexId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "series_userId_mangadexId_key" ON "series"("userId", "mangadexId");
