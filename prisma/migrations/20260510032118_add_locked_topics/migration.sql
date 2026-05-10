-- CreateEnum
CREATE TYPE "NotifyMode" AS ENUM ('DIGEST', 'ALERT');

-- CreateEnum
CREATE TYPE "FindingSource" AS ENUM ('ARTICLE', 'GOOGLE', 'BRAVE', 'REDDIT', 'RSS', 'SCRAPE', 'WEBPAGE');

-- AlterTable
ALTER TABLE "StoryCluster" ALTER COLUMN "regions" DROP DEFAULT,
ALTER COLUMN "themes" DROP DEFAULT,
ALTER COLUMN "topSources" DROP DEFAULT;

-- CreateTable
CREATE TABLE "LockedTopic" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT NOT NULL,
    "userContext" TEXT NOT NULL,
    "aiRefinedQuery" TEXT NOT NULL,
    "aiQuerySummary" TEXT NOT NULL,
    "sources" JSONB NOT NULL,
    "searchBeyondSources" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notifyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notifyMode" "NotifyMode" NOT NULL DEFAULT 'DIGEST',
    "notifyThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "notifyChannels" JSONB NOT NULL,
    "matchCount" INTEGER NOT NULL DEFAULT 0,
    "lastMatchedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "lastScannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LockedTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicFinding" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "sourceType" "FindingSource" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "rawArticleId" TEXT,
    "relevanceScore" DOUBLE PRECISION,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "foundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "TopicFinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TopicFinding_topicId_foundAt_idx" ON "TopicFinding"("topicId", "foundAt");

-- CreateIndex
CREATE INDEX "TopicFinding_topicId_relevanceScore_idx" ON "TopicFinding"("topicId", "relevanceScore");

-- CreateIndex
CREATE UNIQUE INDEX "TopicFinding_topicId_sourceUrl_key" ON "TopicFinding"("topicId", "sourceUrl");

-- AddForeignKey
ALTER TABLE "TopicFinding" ADD CONSTRAINT "TopicFinding_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "LockedTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
