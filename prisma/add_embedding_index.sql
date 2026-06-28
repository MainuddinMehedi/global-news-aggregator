-- Enable the pgvector extension if not already enabled in the Supabase PostgreSQL database
CREATE EXTENSION IF NOT EXISTS vector;

-- Alter ProcessedArticle table to add the embedding column of 768 dimensions (Google gemini-embedding-001)
-- Note: This matches schema.prisma's Unsupported("vector(768)") declaration
ALTER TABLE "ProcessedArticle" ADD COLUMN IF NOT EXISTS "embedding" vector(768);

-- Create a high-performance HNSW index on the embedding column using cosine distance (vector_cosine_ops)
-- This prevents table scans/brute force calculations when matching queries on >10K articles
CREATE INDEX IF NOT EXISTS idx_processed_article_embedding ON "ProcessedArticle"
  USING hnsw (embedding vector_cosine_ops);
