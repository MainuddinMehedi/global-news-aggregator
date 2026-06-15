import { prisma } from "../db/prisma.js";
import { enrichWithStage1 } from "./stage1.js";
import { enrichWithStage2Batch } from "./stage2.js";
import { scanLockedTopicsRealtime } from "../topics/realtimeMatcher.js";

export function createArticleProcessor(
  batchSize = parseInt(process.env.AI_BATCH_SIZE) || 5,
) {
  const buffer = [];
  let currentBatchPromise = null;
  let flushPromise = null;

  function scheduleFlush() {
    if (!flushPromise) {
      flushPromise = _flush().finally(() => {
        flushPromise = null;
      });
    }

    return flushPromise;
  }

  async function _flush() {
    if (buffer.length === 0) return;

    if (currentBatchPromise) {
      await currentBatchPromise;
      return _flush();
    }

    // Fixed batch size of 30 protects the 512MB RAM microservice limit
    // while completely avoiding token-counting overhead.
    const batch = buffer.splice(0, 30);

    if (batch.length === 0) {
      if (buffer.length > 0) {
        console.warn(
          `⚠️ Batch empty but buffer has ${buffer.length} items. Dropping first item to unblock.`,
        );
        buffer.shift();
        return _flush();
      }
      return;
    }

    console.log(
      `⚙️ Processing batch of ${batch.length} articles via Local Pipeline (Stage 1 + Stage 2)...`,
    );

    currentBatchPromise = (async () => {
      try {
        // Stage 1: Deterministic Enrichment
        const stage1Results = batch.map((article) => ({
          article,
          stage1: enrichWithStage1(article),
        }));

        // --- THE SIEVE ---
        // Keep canonical categories (geopolitics, sports, etc.) but DROP 'other'
        const validIndices = [];
        const validBatch = [];
        const validCategories = [];
        for (let i = 0; i < stage1Results.length; i++) {
          if (stage1Results[i].stage1.categories[0] !== "other") {
            validIndices.push(i);
            validBatch.push(batch[i]);
            validCategories.push(stage1Results[i].stage1.categories[0]);
          } else {
            console.log(
              `🗑️ Dropped from processing: ${batch[i].title} (Category: other)`,
            );
          }
        }

        // Stage 2: Local ML Enrichment
        let stage2Results = [];
        if (validBatch.length > 0) {
          try {
            stage2Results = await enrichWithStage2Batch(
              validBatch,
              validCategories,
            );
          } catch (err) {
            console.error(`⚠️ Stage 2 ML batch processing failed`, err.message);
            // Fallback if the Python microservice is completely down
            stage2Results = validBatch.map((article) => ({
              ...article,
              entities: [],
              sentimentScore: null,
            }));
          }
        }

        let successCount = 0;
        const successfullyProcessedArticles = [];

        // Save to DB sequentially to prevent 'connectOrCreate' unique constraint race conditions
        for (let j = 0; j < validBatch.length; j++) {
          const originalIndex = validIndices[j];
          const rawArticle = validBatch[j];
          const s1 = stage1Results[originalIndex].stage1;
          const s2 = stage2Results[j];

          const finalCats = s1.categories;

          const categoryOps = finalCats.map((cat) => ({
            where: { name: cat },
            create: { name: cat },
          }));

          try {
            await prisma.$transaction(
              async (tx) => {
                // Create ProcessedArticle
                await tx.processedArticle.create({
                  data: {
                    rawArticleId: rawArticle.id,
                    categories: { connectOrCreate: categoryOps },
                    entities: s2.entities || [],
                    sentimentScore: s2.sentimentScore || null,
                    biasNote: s1.biasNote || null,
                    eventRegion: s1.eventRegion || null,
                    model: "local-pipeline-v1",
                    clusterStatus: "HOLDING",
                  },
                });
              },
              {
                timeout: 15000,
              },
            );

            successCount++;
            successfullyProcessedArticles.push({
              ...rawArticle,
              categories: finalCats,
              entities: s2.entities || [],
              sentimentScore: s2.sentimentScore ?? null,
              eventRegion: s1.eventRegion || null,
            });
          } catch (err) {
            console.error(
              `⚠️ Failed to save processed article: ${rawArticle.title}`,
              err.message,
            );
          }
        }

        console.log(`✅ Batch done: ${successCount}/${batch.length} succeeded`);

        if (successfullyProcessedArticles.length > 0) {
          await scanLockedTopicsRealtime(successfullyProcessedArticles);
        }
      } catch (err) {
        console.error("❌ Batch processing failed:", err);
      }
    })();

    await currentBatchPromise;
    currentBatchPromise = null;

    if (buffer.length > 0) {
      return _flush();
    }
  }

  return {
    async add(rawArticle) {
      // Pre-check: skip if already processed (by rawArticleId)
      const exists = await prisma.processedArticle.findUnique({
        where: {
          rawArticleId: rawArticle.id,
        },
      });

      if (exists) {
        console.log(`⏭️ Already processed: ${rawArticle.title}`);
        return;
      }

      buffer.push(rawArticle);
      if (buffer.length >= batchSize && !currentBatchPromise) {
        scheduleFlush();
      }
    },
    async flush() {
      while (flushPromise || currentBatchPromise || buffer.length > 0) {
        if (flushPromise) {
          await flushPromise;
        } else if (currentBatchPromise) {
          await currentBatchPromise;
        } else {
          await scheduleFlush();
        }
      }
    },
  };
}
