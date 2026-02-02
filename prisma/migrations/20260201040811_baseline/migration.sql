-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SeriesStatus" AS ENUM ('READING', 'COMPLETED', 'ON_HOLD', 'DROPPED', 'PLAN_TO_READ');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('NEW', 'LIKE_NEW', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE', 'POOR');

-- CreateEnum
CREATE TYPE "Editorial" AS ENUM ('PLANETA_COMIC', 'PLANETA_DEAGOSTINI');

-- CreateEnum
CREATE TYPE "Store" AS ENUM ('AMAZON', 'VINTED', 'WALLAPOP', 'ABACUS', 'CASA_DEL_LIBRO', 'NA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "status" "SeriesStatus" NOT NULL DEFAULT 'READING',
    "totalVolumes" INTEGER,
    "coverImage" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "retailPrice" DOUBLE PRECISION,
    "malId" INTEGER,
    "publishing" BOOLEAN NOT NULL DEFAULT false,
    "editorial" "Editorial",

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volumes" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "volumeNumber" INTEGER NOT NULL,
    "owned" BOOLEAN NOT NULL DEFAULT false,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "pricePaid" DOUBLE PRECISION,
    "condition" "Condition",
    "purchaseDate" TIMESTAMP(3),
    "readDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isbn" TEXT,
    "coverImage" TEXT,
    "title" TEXT,
    "store" "Store",

    CONSTRAINT "volumes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "series_userId_idx" ON "series"("userId");

-- CreateIndex
CREATE INDEX "idx_series_userid" ON "series"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "series_userId_malId_key" ON "series"("userId", "malId");

-- CreateIndex
CREATE INDEX "volumes_seriesId_idx" ON "volumes"("seriesId");

-- CreateIndex
CREATE INDEX "idx_volumes_seriesid" ON "volumes"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "volumes_seriesId_volumeNumber_key" ON "volumes"("seriesId", "volumeNumber");

-- AddForeignKey
ALTER TABLE "series" ADD CONSTRAINT "series_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volumes" ADD CONSTRAINT "volumes_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

