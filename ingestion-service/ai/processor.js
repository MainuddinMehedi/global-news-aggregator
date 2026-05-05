import { processBatchWithAI, processClusteringBatchWithAI } from "./client.js";
import { createNextBatch } from "./tokenBatcher.js";
import { prisma } from "../db/client.js";
import { ALLOWED_CATEGORIES } from "./categories.js";

export function createArticleProcessor(
  batchSize = parseInt(process.env.AI_BATCH_SIZE) || 5,
) {
  const buffer = [];
  let currentBatchPromise = null;

  async function _flush() {
    if (buffer.length === 0) return;

    if (currentBatchPromise) {
      await currentBatchPromise;
      return _flush();
    }

    const { batch, remainingArticles, estimatedTokens } = createNextBatch(
      buffer,
      800,
    );
    // update buffer
    buffer.length = 0;
    buffer.push(...remainingArticles);

    if (batch.length === 0) {
      if (buffer.length > 0) {
        // First article might be too large and stuck? Actually prepareArticle handles it or drops it.
        // If batch is empty but buffer isn't, maybe we need to drop the first to unblock.
        console.warn(
          `⚠️ Batch empty but buffer has ${buffer.length} items. Dropping first item to unblock.`,
        );
        buffer.shift();
        return _flush();
      }
      return;
    }

    console.log(
      `🤖 Processing batch of ${batch.length} articles (Estimated tokens: ${estimatedTokens})...`,
    );

    currentBatchPromise = (async () => {
      try {
        let aiResponse;
        try {
          aiResponse = await processBatchWithAI(batch, estimatedTokens);
        } catch (err) {
          console.error(`⚠️ AI batch processing failed`, err.message);
          throw err;
        }

        let parsed;
        try {
          parsed = JSON.parse(
            aiResponse.content.replace(/```json|```/g, "").trim(),
          );
          if (!parsed.results || !Array.isArray(parsed.results)) {
            throw new Error("Invalid format: missing 'results' array");
          }
        } catch (err) {
          console.warn(`⚠️ Invalid JSON from AI for batch`);
          parsed = { results: [] };
        }

        const resultsMap = new Map();
        parsed.results.forEach((res) => {
          if (res && res.id) resultsMap.set(res.id, res);
        });

        let successCount = 0;
        const successfullyProcessedArticles = [];

        // Save to DB sequentially to prevent 'connectOrCreate' unique constraint race conditions
        for (const article of batch) {
          const rawArticle = article;
          const articleParsed = resultsMap.get(rawArticle.id) || {
            categories: ["other"],
            entities: [],
            sentimentScore: 0,
            biasNote: "",
            perspectiveCountries: [],
          };

          const rawCats = articleParsed.categories || [];
          const validCats = rawCats.filter((c) =>
            ALLOWED_CATEGORIES.includes(c),
          );
          const finalCats = validCats.length > 0 ? validCats : ["other"];

          if (rawCats.length !== validCats.length) {
            const dropped = rawCats.filter(
              (c) => !ALLOWED_CATEGORIES.includes(c),
            );
            console.warn(
              `⚠️ Dropped unrecognized categories for "${rawArticle.title}": [${dropped.join(", ")}]`,
            );
          }

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
                    entities: articleParsed.entities || [],
                    sentimentScore: articleParsed.sentimentScore || null,
                    biasNote: articleParsed.biasNote || null,
                    biasCategory: articleParsed.biasCategory || null,
                    perspectiveCountries:
                      articleParsed.perspectiveCountries || [],
                    model: aiResponse.model,
                  },
                });
              },
              {
                timeout: 15000,
              },
            );

            successCount++;
            successfullyProcessedArticles.push(rawArticle);
          } catch (err) {
            console.error(
              `⚠️ Failed to save processed article: ${rawArticle.title}`,
              err.message,
            );
          }
        }

        // Log AI Usage ONCE per batch
        try {
          const today = new Date().toISOString().split("T")[0];
          const costPer1k = 0.0006;
          const estimatedCost = (aiResponse.tokensUsed / 1000) * costPer1k;

          await prisma.aiUsage.create({
            data: {
              date: today,
              provider: aiResponse.provider,
              model: aiResponse.model,
              tokensUsed: aiResponse.tokensUsed,
              estimatedCost: estimatedCost,
              success: true,
            },
          });
        } catch (err) {
          console.error(`⚠️ Failed to log AI usage for batch`, err.message);
        }

        console.log(`✅ Batch done: ${successCount}/${batch.length} succeeded`);

        // ==========================================
        // 2. PASS: STORY CLUSTERING
        // ==========================================
        if (successfullyProcessedArticles.length > 0) {
          try {
            console.log(`🤖 Running clustering pass for ${successfullyProcessedArticles.length} articles...`);
            
            // Fetch active clusters to provide context to the AI
            const activeClusters = await prisma.storyCluster.findMany({
              where: { isActive: true },
              orderBy: { updatedAt: 'desc' },
              take: 20
            });

            // Make the clustering AI request
            const clusteringResponse = await processClusteringBatchWithAI(successfullyProcessedArticles, activeClusters, 500);

            let clusterData;
            try {
              clusterData = JSON.parse(
                clusteringResponse.content.replace(/```json|```/g, "").trim()
              );
            } catch (err) {
              console.warn(`⚠️ Invalid JSON from clustering AI`);
              clusterData = { assignments: [], newClusters: [] };
            }

            const { assignments = [], newClusters = [] } = clusterData;

            // Save new clusters
            for (const nc of newClusters) {
              try {
                // Ensure articleIds is an array and filter out any invalid/null IDs
                const validArticleIds = Array.isArray(nc.articleIds) ? nc.articleIds.filter(id => id) : [];
                const articlesToConnect = validArticleIds.map(id => ({ rawArticleId: id }));

                await prisma.storyCluster.create({
                  data: {
                    title: nc.title,
                    summary: nc.summary,
                    timeWindow: nc.timeWindow || "Just Started",
                    keyDevelopments: nc.keyDevelopments || [],
                    articles: {
                      connect: articlesToConnect
                    }
                  }
                });
                console.log(`+ Created new cluster: "${nc.title}"`);
              } catch (err) {
                 console.error(`⚠️ Failed to create new cluster: ${nc.title}`, err.message);
              }
            }

            // Update existing cluster assignments
            for (const assignment of assignments) {
               if (!assignment.clusterId || !assignment.articleId) continue;
               try {
                 await prisma.processedArticle.update({
                   where: { rawArticleId: assignment.articleId },
                   data: {
                     storyClusters: {
                       connect: { id: assignment.clusterId }
                     }
                   }
                 });
                 // Touch the cluster's updatedAt
                 await prisma.storyCluster.update({
                   where: { id: assignment.clusterId },
                   data: { updatedAt: new Date() }
                 });
               } catch (err) {
                 console.error(`⚠️ Failed to assign article ${assignment.articleId} to cluster ${assignment.clusterId}`, err.message);
               }
            }

            // Log AI Usage for clustering
            try {
              const today = new Date().toISOString().split("T")[0];
              const costPer1k = 0.0006;
              const estimatedCost = (clusteringResponse.tokensUsed / 1000) * costPer1k;
              await prisma.aiUsage.create({
                data: {
                  date: today,
                  provider: clusteringResponse.provider,
                  model: clusteringResponse.model,
                  tokensUsed: clusteringResponse.tokensUsed,
                  estimatedCost: estimatedCost,
                  success: true,
                },
              });
            } catch (err) {
              console.error(`⚠️ Failed to log AI usage for clustering batch`, err.message);
            }

          } catch (err) {
             console.error(`❌ Clustering pass failed:`, err);
          }
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
        _flush();
      }
    },
    async flush() {
      if (currentBatchPromise) await currentBatchPromise;
      if (buffer.length > 0) await _flush();
    },
  };
}
