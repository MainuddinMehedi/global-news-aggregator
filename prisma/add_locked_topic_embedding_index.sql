-- Create the HNSW index for LockedTopic queryEmbedding
CREATE INDEX IF NOT EXISTS idx_locked_topic_query_embedding
ON "LockedTopic" USING hnsw ("queryEmbedding" vector_cosine_ops);
