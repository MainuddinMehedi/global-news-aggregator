-- AlterTable
ALTER TABLE "LockedTopic" ADD COLUMN "liveSummary" TEXT;

-- AlterEnum
ALTER TYPE "FindingSource" ADD VALUE 'SEARCH';
