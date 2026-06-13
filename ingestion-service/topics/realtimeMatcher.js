import { prisma } from "../db/prisma.js";

/**
 * Scans newly ingested articles against active locked topics in real-time.
 * This runs directly in the ingestion pipeline after Stage 2 enrichment.
 * 
 * Note: This performs a naive keyword match and hardcodes a relevance score,
 * bypassing the heavier LLM relevance scoring done in the scheduled topics worker.
 */
export async function scanLockedTopicsRealtime(newArticles) {
  if (newArticles.length === 0) return;

  const activeTopics = await prisma.lockedTopic.findMany({
    where: { isActive: true },
  });

  if (activeTopics.length === 0) return;

  console.log(
    `🔍 Scanning ${newArticles.length} newly ingested articles against ${activeTopics.length} locked topics...`,
  );

  for (const topic of activeTopics) {
    const matches = newArticles.filter((article) => {
      const content = (
        article.title +
        " " +
        (article.contentSnippet || "")
      ).toLowerCase();
      const queryTerms = topic.aiRefinedQuery
        .toLowerCase()
        .split(" ")
        .filter((t) => t.length > 2);
      
      if (queryTerms.length === 0) return false;
      return queryTerms.every((term) => content.includes(term));
    });

    if (matches.length > 0) {
      console.log(
        `   🎯 Found ${matches.length} real-time matches for "${topic.displayName}"`,
      );

      for (const match of matches) {
        try {
          await prisma.topicFinding.upsert({
            where: {
              topicId_sourceUrl: {
                topicId: topic.id,
                sourceUrl: match.url,
              },
            },
            create: {
              topicId: topic.id,
              sourceType: "ARTICLE",
              sourceName: match.source,
              sourceUrl: match.url,
              title: match.title,
              summary: match.contentSnippet,
              publishedAt: match.publishedAt,
              relevanceScore: 0.85, // Hardcoded for real-time matches to skip LLM scoring overhead
            },
            update: {},
          });
        } catch (err) {
          // Ignore upsert errors (e.g. race conditions)
        }
      }

      await prisma.lockedTopic.update({
        where: { id: topic.id },
        data: {
          matchCount: { increment: matches.length },
          lastMatchedAt: new Date(),
          lastScannedAt: new Date(),
        },
      });
    } else {
      await prisma.lockedTopic.update({
        where: { id: topic.id },
        data: { lastScannedAt: new Date() },
      });
    }
  }
}
