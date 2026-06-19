/*
  Warnings:

  - The values [BRAVE] on the enum `FindingSource` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FindingSource_new" AS ENUM ('ARTICLE', 'GOOGLE', 'REDDIT', 'RSS', 'SCRAPE', 'WEBPAGE', 'GITHUB', 'BD_GOV_JOBS', 'COMPANY_CAREERS', 'SEARCH', 'YOUTUBE');
ALTER TABLE "TopicFinding" ALTER COLUMN "sourceType" TYPE "FindingSource_new" USING ("sourceType"::text::"FindingSource_new");
ALTER TYPE "FindingSource" RENAME TO "FindingSource_old";
ALTER TYPE "FindingSource_new" RENAME TO "FindingSource";
DROP TYPE "public"."FindingSource_old";
COMMIT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "suspended" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "FeedSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sourceCountry" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "biasGroup" TEXT NOT NULL,
    "coverageScope" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "fetchFailures" INTEGER NOT NULL DEFAULT 0,
    "lastFetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "SystemTask" (
    "id" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "heartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorMessage" TEXT,
    "metadata" JSONB,

    CONSTRAINT "SystemTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeedSource_name_key" ON "FeedSource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FeedSource_url_key" ON "FeedSource"("url");

-- CreateIndex
CREATE INDEX "SystemTask_taskName_status_idx" ON "SystemTask"("taskName", "status");

-- CreateIndex
CREATE INDEX "SystemTask_startedAt_idx" ON "SystemTask"("startedAt");
