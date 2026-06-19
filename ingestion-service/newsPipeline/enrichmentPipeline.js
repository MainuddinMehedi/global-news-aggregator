import { prisma } from "../db/prisma.js";
import { enrichWithStage1 } from "./stage1.js";
import { enrichWithStage2Batch } from "./stage2.js";
import { primaryConfig } from "../ai/aiConfig.js";

export function createArticleProcessor(
  batchSize = primaryConfig.batchSize,
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

    // Read configured batch size dynamically to pace requests safely
    const batch = buffer.splice(0, batchSize);

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
        // Keep canonical categories (geopolitics, sports, etc.) but process 'other' as SKIPPED
        const validIndices = [];
        const validBatch = [];
        const validCategories = [];
        for (let i = 0; i < stage1Results.length; i++) {
          const rawArticle = batch[i];
          const s1 = stage1Results[i].stage1;

          if (s1.categories[0] !== "other") {
            validIndices.push(i);
            validBatch.push({
              ...rawArticle,
              eventRegion: s1.eventRegion || null,
            });
            validCategories.push(s1.categories[0]);
          } else {
            // Save immediately as SKIPPED to prevent backlog re-processing
            try {
              await prisma.$transaction(
                async (tx) => {
                  await tx.processedArticle.create({
                    data: {
                      rawArticleId: rawArticle.id,
                      categories: {
                        connectOrCreate: {
                          where: { name: "other" },
                          create: { name: "other" },
                        },
                      },
                      entities: [],
                      sentimentScore: null,
                      biasNote: null,
                      eventRegion: s1.eventRegion || null,
                      model: "stage1-only",
                      clusterStatus: "SKIPPED",
                    },
                  });
                },
                { timeout: 15000 }
              );
              console.log(
                `🗑️ Skipped ML processing (Category: other) | Title: "${rawArticle.title}" (Saved to DB to prevent backlog re-processing)`
              );
            } catch (err) {
              console.error(
                `⚠️ Failed to save skipped article: ${rawArticle.title}`,
                err.message,
              );
            }
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
                    sentimentScore: s2.sentimentScore ?? null,
                    biasNote: s2.biasNote || null,
                    eventRegion: s1.eventRegion || null,
                    model: s2.model || "mistral-small-2506",
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
              biasNote: s2.biasNote || null,
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
