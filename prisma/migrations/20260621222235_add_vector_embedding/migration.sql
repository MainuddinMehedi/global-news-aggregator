-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "ProcessedArticle" ADD COLUMN     "embedding" vector(768);

-- CreateIndex
CREATE INDEX IF NOT EXISTS idx_processed_article_embedding ON "ProcessedArticle" USING hnsw (embedding vector_cosine_ops);

