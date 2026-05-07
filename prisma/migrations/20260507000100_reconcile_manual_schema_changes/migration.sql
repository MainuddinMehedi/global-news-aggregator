-- Reconcile schema changes that already exist in the live database but were
-- not captured in committed Prisma migration history.

ALTER TABLE "RawArticle" ADD COLUMN IF NOT EXISTS "extractedContent" TEXT;
ALTER TABLE "RawArticle" ADD COLUMN IF NOT EXISTS "slug" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "RawArticle_slug_key" ON "RawArticle"("slug");

ALTER TABLE "StoryCluster" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "StoryCluster" ADD COLUMN IF NOT EXISTS "impact" TEXT;
ALTER TABLE "StoryCluster" ADD COLUMN IF NOT EXISTS "impactScore" DOUBLE PRECISION;
ALTER TABLE "StoryCluster" ADD COLUMN IF NOT EXISTS "status" TEXT;
ALTER TABLE "StoryCluster" ADD COLUMN IF NOT EXISTS "whyItMatters" TEXT;
ALTER TABLE "StoryCluster" ADD COLUMN IF NOT EXISTS "regions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "StoryCluster" ADD COLUMN IF NOT EXISTS "themes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "StoryCluster" ADD COLUMN IF NOT EXISTS "articleCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoryCluster" ADD COLUMN IF NOT EXISTS "sourceCount" INTEGER;
ALTER TABLE "StoryCluster" ADD COLUMN IF NOT EXISTS "topSources" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "StoryCluster" ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3);
ALTER TABLE "StoryCluster" ADD COLUMN IF NOT EXISTS "activityScore" DOUBLE PRECISION;
ALTER TABLE "StoryCluster" ADD COLUMN IF NOT EXISTS "trendData" JSONB;

UPDATE "StoryCluster"
SET "slug" =
  COALESCE(
    NULLIF(regexp_replace(lower("title"), '[^a-z0-9]+', '-', 'g'), ''),
    'story'
  ) || '-' || substring("id" from 1 for 8)
WHERE "slug" IS NULL;

UPDATE "StoryCluster"
SET "articleCount" = (
  SELECT COUNT(*)
  FROM "_ArticleStoryClusters"
  WHERE "_ArticleStoryClusters"."B" = "StoryCluster"."id"
)
WHERE "articleCount" = 0;

ALTER TABLE "StoryCluster" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "StoryCluster_slug_key" ON "StoryCluster"("slug");
