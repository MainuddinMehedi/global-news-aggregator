-- AlterTable
ALTER TABLE "ProcessedArticle" ADD COLUMN     "clusterStatus" TEXT NOT NULL DEFAULT 'HOLDING',
ADD COLUMN     "clusteredAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StoryCluster" ADD COLUMN     "momentumScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'DEVELOPING';
