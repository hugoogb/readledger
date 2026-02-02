/*
  Warnings:

  - You are about to drop the column `editorial` on the `series` table. All the data in the column will be lost.
  - You are about to drop the column `store` on the `volumes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "series" DROP COLUMN "editorial",
ADD COLUMN     "publisherId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR';

-- AlterTable
ALTER TABLE "volumes" DROP COLUMN "store",
ADD COLUMN     "storeId" TEXT,
ADD COLUMN     "wishlist" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "Editorial";

-- DropEnum
DROP TYPE "Store";

-- CreateTable
CREATE TABLE "publishers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publishers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_stores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_stores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "publishers_userId_idx" ON "publishers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "publishers_userId_name_key" ON "publishers"("userId", "name");

-- CreateIndex
CREATE INDEX "user_stores_userId_idx" ON "user_stores"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_stores_userId_name_key" ON "user_stores"("userId", "name");

-- AddForeignKey
ALTER TABLE "publishers" ADD CONSTRAINT "publishers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stores" ADD CONSTRAINT "user_stores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series" ADD CONSTRAINT "series_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "publishers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volumes" ADD CONSTRAINT "volumes_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "user_stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
