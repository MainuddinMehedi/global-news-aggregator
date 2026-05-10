-- CreateTable
CREATE TABLE "StoryCluster" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "timeWindow" TEXT,
    "keyDevelopments" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArticleStoryClusters" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArticleStoryClusters_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ArticleStoryClusters_B_index" ON "_ArticleStoryClusters"("B");

-- AddForeignKey
ALTER TABLE "_ArticleStoryClusters" ADD CONSTRAINT "_ArticleStoryClusters_A_fkey" FOREIGN KEY ("A") REFERENCES "ProcessedArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleStoryClusters" ADD CONSTRAINT "_ArticleStoryClusters_B_fkey" FOREIGN KEY ("B") REFERENCES "StoryCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
