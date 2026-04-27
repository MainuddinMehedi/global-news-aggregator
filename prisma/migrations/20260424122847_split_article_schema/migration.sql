/*
  Warnings:

  - You are about to drop the `Article` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ArticleCategories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserTopic" DROP CONSTRAINT "UserTopic_articleId_fkey";

-- DropForeignKey
ALTER TABLE "_ArticleCategories" DROP CONSTRAINT "_ArticleCategories_A_fkey";

-- DropForeignKey
ALTER TABLE "_ArticleCategories" DROP CONSTRAINT "_ArticleCategories_B_fkey";

-- DropTable
DROP TABLE "Article";

-- DropTable
DROP TABLE "_ArticleCategories";

-- CreateTable
CREATE TABLE "RawArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentSnippet" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceCountry" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentHash" TEXT,
    "rawMetadata" JSONB,

    CONSTRAINT "RawArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedArticle" (
    "id" TEXT NOT NULL,
    "rawArticleId" TEXT NOT NULL,
    "entities" TEXT[],
    "sentimentScore" DOUBLE PRECISION,
    "biasNote" TEXT,
    "perspectiveCountries" TEXT[],
    "model" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsage" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProcessedArticleCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProcessedArticleCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "RawArticle_url_key" ON "RawArticle"("url");

-- CreateIndex
CREATE UNIQUE INDEX "RawArticle_contentHash_key" ON "RawArticle"("contentHash");

-- CreateIndex
CREATE INDEX "RawArticle_publishedAt_idx" ON "RawArticle"("publishedAt");

-- CreateIndex
CREATE INDEX "RawArticle_sourceCountry_idx" ON "RawArticle"("sourceCountry");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedArticle_rawArticleId_key" ON "ProcessedArticle"("rawArticleId");

-- CreateIndex
CREATE INDEX "AiUsage_date_idx" ON "AiUsage"("date");

-- CreateIndex
CREATE INDEX "_ProcessedArticleCategories_B_index" ON "_ProcessedArticleCategories"("B");

-- AddForeignKey
ALTER TABLE "UserTopic" ADD CONSTRAINT "UserTopic_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "ProcessedArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessedArticle" ADD CONSTRAINT "ProcessedArticle_rawArticleId_fkey" FOREIGN KEY ("rawArticleId") REFERENCES "RawArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProcessedArticleCategories" ADD CONSTRAINT "_ProcessedArticleCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProcessedArticleCategories" ADD CONSTRAINT "_ProcessedArticleCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "ProcessedArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
