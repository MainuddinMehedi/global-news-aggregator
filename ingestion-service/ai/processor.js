import { prisma } from "../db/prisma.js";
import { enrichWithStage2Batch } from "./stage2.js";
import { scanLockedTopicsRealtime } from "../topics/realtimeMatcher.js";
export function createArticleProcessor(
  batchSize = parseInt(process.env.AI_BATCH_SIZE) || 5,
) {
  const buffer = [];
  const processedArticlesBuffer = [];
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

        // Stage 2: Local ML Enrichment
        let stage2Results = [];
        try {
          stage2Results = await enrichWithStage2Batch(batch);
        } catch (err) {
          console.error(`⚠️ Stage 2 ML batch processing failed`, err.message);
          // Fallback if the Python microservice is completely down
          stage2Results = batch.map((article) => ({
            ...article,
            entities: [],
            sentimentScore: null,
          }));
        }

        let successCount = 0;
        const successfullyProcessedArticles = [];

        // Save to DB sequentially to prevent 'connectOrCreate' unique constraint race conditions
        for (let i = 0; i < batch.length; i++) {
          const rawArticle = batch[i];
          const s1 = stage1Results[i].stage1;
          const s2 = stage2Results[i];

          const finalCats =
            s1.categories && s1.categories.length > 0
              ? s1.categories
              : ["other"];

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
                    perspectiveCountries: s1.perspectiveCountries || [],
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
              perspectiveCountries: s1.perspectiveCountries || [],
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
