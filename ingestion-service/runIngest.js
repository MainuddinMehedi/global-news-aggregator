import "dotenv/config";
import { prisma } from "./db/prisma.js";
import fetchRSSStream from "./newsPipeline/rss.js";
import { getActiveFeeds } from "./data/feeds.js";
import normalizeUrl from "./utils/normalizeUrl.js";
import hashSnippet from "./utils/hashSnippet.js";
import formatDuration from "./utils/formatDuration.js";
import revalidateCache from "./utils/revalidateCache.js";
import { generateSlug } from "./utils/generateSlug.js";
import { createArticleProcessor } from "./newsPipeline/enrichmentPipeline.js";
import { startTaskLogging, updateTaskHeartbeat, completeTaskLogging } from "./utils/taskLogger.js";
import { loadConfigOverrides } from "./ai/aiConfig.js";

// ── CLI Flags ────────────────────────────────────────────────
const args = process.argv.slice(2);
const skipAI = args.includes("--skip-ai");
const aiLimitArg = args.find((a) => a.startsWith("--ai-limit="));
const aiLimit = aiLimitArg ? parseInt(aiLimitArg.split("=")[1]) : Infinity;

const startTime = Date.now();

export async function runIngestionPipeline() {
  const taskId = await startTaskLogging("rss-ingestion");
  try {
    await loadConfigOverrides(prisma);
    const aiProcessor = skipAI ? null : createArticleProcessor();
    // ── Log run mode ──
    if (skipAI) {
      console.log("🚀 Running in RAW-ONLY mode (--skip-ai): no AI processing\n");
    } else if (aiLimit < Infinity) {
      console.log(`🚀 Running with AI limit: ${aiLimit} articles max\n`);
    }

    const sources = await getActiveFeeds();
    
    let totalFetched = 0;
    let totalInserted = 0;
    let totalDupes = 0;
    let aiQueued = 0;

    for (const src of sources) {
      await updateTaskHeartbeat(taskId);
      console.log(`\n📡 Streaming..: ${src.name} (${src.sourceCountry})\n`);

      for await (const item of fetchRSSStream(
        src.name,
        src.sourceCountry,
        src.sourceType,
        src.url,
        src.biasGroup,
        src.coverageScope,
      )) {
        totalFetched++;

        const normUrl = normalizeUrl(item.url);
        if (!normUrl) continue;

        // Dedup 1: URL
        const existingUrl = await prisma.rawArticle.findUnique({
          where: { url: normUrl },
          select: { id: true },
        });
        if (existingUrl) {
          totalDupes++;
          continue;
        }

        // Dedup 2: Content Hash (fallback)
        const hash = hashSnippet(item.title + item.contentSnippet);
        const existingHash = await prisma.rawArticle.findFirst({
          where: { contentHash: hash },
          select: { id: true },
        });
        if (existingHash) {
          totalDupes++;
          continue;
        }

        item.url = normUrl;
        item.contentHash = hash;

        try {
          const rawArticle = await prisma.rawArticle.create({
            data: {
              title: item.title,
              url: item.url,
              contentSnippet: item.contentSnippet,
              source: item.source,
              sourceCountry: item.sourceCountry,
              sourceType: item.sourceType,
              biasGroup: item.biasGroup,
              coverageScope: item.coverageScope,
              publishedAt: item.publishedAt,
              contentHash: item.contentHash,
              slug: generateSlug(item.title),
            },
          });
          totalInserted++;
          console.log(`+ Inserted: ${item.title}`);

          // Add to AI Processing Queue (if enabled and under limit)
          if (aiProcessor && aiQueued < aiLimit) {
            await aiProcessor.add(rawArticle);
            aiQueued++;
          }
        } catch (err) {
          console.error(`- Failed to insert: ${item.title}`, err.message);
        }
      }
    }

    if (aiProcessor) {
      console.log("\n🤖 Flushing remaining local ML tasks...");
      await aiProcessor.flush();
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
    console.log(`✅ Ingestion complete in ${elapsed}`);
    console.log(
      `   📥 Fetched: ${totalFetched} items from ${sources.length} sources`,
    );
    console.log(`   ➕ Inserted: ${totalInserted} new articles`);
    console.log(`   🔁 Duplicates skipped: ${totalDupes}`);
    if (!skipAI) {
      console.log(
        `   🤖 Local ML queued: ${aiQueued}${aiLimit < Infinity ? ` (limit: ${aiLimit})` : ""}`,
      );
    }
    console.log(`${"─".repeat(50)}\n`);

    await completeTaskLogging(taskId, "SUCCESS", {
      fetchedCount: totalFetched,
      insertedCount: totalInserted,
      dupeCount: totalDupes,
      aiQueuedCount: aiQueued,
    });
  } catch (err) {
    console.error("Error in ingestion pipeline:", err);
    await completeTaskLogging(taskId, "FAILED", null, err.message);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly from CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  runIngestionPipeline().catch((err) => {
    console.error("Worker encountered an error:", err);
    process.exit(1);
  });
}
