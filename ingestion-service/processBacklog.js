/**
 * Process unprocessed RawArticles through AI.
 *
 * Queries RawArticle rows that have no linked ProcessedArticle
 * and feeds them through the AI processor with rate limiting.
 *
 * Usage:
 *   node ingestion-service/processBacklog.js              # process all
 *   node ingestion-service/processBacklog.js --limit=50   # process up to 50
 */

import "dotenv/config";
import { prisma } from "./db/prisma.js";
import { enrichWithStage1 } from "./newsPipeline/stage1.js";
import { createArticleProcessor } from "./newsPipeline/enrichmentPipeline.js";
import formatDuration from "./utils/formatDuration.js";
import cleanupOldSkippedArticles from "./utils/cleanupOldSkippedArticles.js";
import revalidateCache from "./utils/revalidateCache.js";

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1]) : undefined;

const startTime = Date.now();

export async function processBacklogLogic() {
  // Find RawArticles that have no ProcessedArticle, or a ProcessedArticle that failed enrichment
  const unprocessed = await prisma.rawArticle.findMany({
    where: {
      OR: [
        { processedArticle: null },
        { processedArticle: { clusterStatus: "FAILED_ENRICHMENT" } },
      ],
    },
    orderBy: { publishedAt: "desc" },
    ...(limit ? { take: limit } : {}),
  });

  if (unprocessed.length === 0) {
    console.log("✅ No unprocessed articles found. Backlog is clear!");
    await prisma.$disconnect();
    return;
  }

  // Delete any existing FAILED_ENRICHMENT ProcessedArticle rows for the selected batch
  const articleIds = unprocessed.map((a) => a.id);
  const deletedFailures = await prisma.processedArticle.deleteMany({
    where: {
      rawArticleId: { in: articleIds },
      clusterStatus: "FAILED_ENRICHMENT",
    },
  });
  if (deletedFailures.count > 0) {
    console.log(`🧹 Cleared ${deletedFailures.count} previously failed enrichment records to retry.`);
  }

  // Pre-filter non-relevant (category: other) articles using Stage 1 Gazetteer
  const relevantArticles = [];
  const skippedArticles = [];

  for (const article of unprocessed) {
    const s1 = enrichWithStage1(article);
    if (s1.categories[0] === "other") {
      skippedArticles.push({ article, s1 });
    } else {
      relevantArticles.push(article);
    }
  }

  console.log(
    `📋 Found ${unprocessed.length} unprocessed articles${limit ? ` (limit: ${limit})` : ""}`
  );
  console.log(
    `   🔍 Stage 1 classification: ${relevantArticles.length} relevant, ${skippedArticles.length} non-relevant ('other')\n`
  );

  let queued = 0;
  if (relevantArticles.length > 0) {
    const aiProcessor = createArticleProcessor();
    for (const article of relevantArticles) {
      await aiProcessor.add(article);
      queued++;
    }

    console.log(`\n🤖 Flushing local ML tasks for ${queued} relevant articles...`);
    await aiProcessor.flush();
  } else {
    console.log("ℹ️ No relevant articles to process via LLM/ML.");
  }

  // Save skipped 'other' articles quietly at the end of backlog processing
  if (skippedArticles.length > 0) {
    console.log(`\n📥 Saving ${skippedArticles.length} skipped 'other' articles to database...`);
    
    // Ensure "other" category exists first to prevent unique constraint race conditions
    await prisma.category.upsert({
      where: { name: "other" },
      update: {},
      create: { name: "other" },
    });

    const chunkSize = 50;
    for (let i = 0; i < skippedArticles.length; i += chunkSize) {
      const chunk = skippedArticles.slice(i, i + chunkSize);
      await prisma.$transaction(
        chunk.map(({ article, s1 }) =>
          prisma.processedArticle.create({
            data: {
              rawArticleId: article.id,
              categories: {
                connect: { name: "other" },
              },
              entities: [],
              sentimentScore: null,
              biasNote: null,
              eventRegion: s1.eventRegion || null,
              model: "stage1-only",
              clusterStatus: "SKIPPED",
            },
          })
        ),
        { timeout: 15000 }
      );
    }
    console.log(`✓ Marked ${skippedArticles.length} articles as skipped.`);
  }

  const elapsed = formatDuration(Date.now() - startTime);

  // --- REVALIDATION LOGIC ---
  const tagsToRevalidate = ["articles", "stories", "locked-topics"];
  try {
    // Find clusters updated during this run to revalidate their specific pages
    const updatedClusters = await prisma.storyCluster.findMany({
      where: {
        updatedAt: {
          gte: new Date(startTime),
        },
      },
      select: { slug: true },
    });

    updatedClusters.forEach((cluster) => {
      if (cluster.slug) {
        tagsToRevalidate.push(`story-${cluster.slug}`);
      }
    });

    // Find locked topics updated during this run
    const updatedTopics = await prisma.lockedTopic.findMany({
      where: {
        updatedAt: {
          gte: new Date(startTime),
        },
      },
      select: { id: true },
    });

    updatedTopics.forEach((topic) => {
      tagsToRevalidate.push(`locked-topic-${topic.id}`);
    });
  } catch (err) {
    console.error("⚠️ Failed to retrieve updated entities for revalidation:", err.message);
  }

  await revalidateCache(tagsToRevalidate);

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ Backlog processing complete in ${elapsed}`);
  console.log(`   🤖 Processed: ${queued} articles`);
  if (skippedArticles.length > 0) {
    console.log(`   🗑️ Skipped:   ${skippedArticles.length} other articles`);
  }
  console.log(`${"─".repeat(50)}\n`);

  // --- TIMED CLEANUP ---
  await cleanupOldSkippedArticles();

  await prisma.$disconnect();
}

// Run if called directly from CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  processBacklogLogic().catch((err) => {
    console.error("Backlog processor encountered an error:", err);
    process.exit(1);
  });
}
