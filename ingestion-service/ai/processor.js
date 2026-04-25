import { processBatchWithAI } from './client.js';
import { createNextBatch } from './tokenBatcher.js';
import { prisma } from '../db/client.js';

export function createArticleProcessor(batchSize = parseInt(process.env.AI_BATCH_SIZE) || 5) {
  const buffer = [];
  let currentBatchPromise = null;

  async function _flush() {
    if (buffer.length === 0) return;
    
    if (currentBatchPromise) {
      await currentBatchPromise;
      return _flush();
    }

    const { batch, remainingArticles, estimatedTokens } = createNextBatch(buffer, 800);
    // update buffer
    buffer.length = 0;
    buffer.push(...remainingArticles);

    if (batch.length === 0) {
      if (buffer.length > 0) {
        // First article might be too large and stuck? Actually prepareArticle handles it or drops it.
        // If batch is empty but buffer isn't, maybe we need to drop the first to unblock.
        console.warn(`⚠️ Batch empty but buffer has ${buffer.length} items. Dropping first item to unblock.`);
        buffer.shift();
        return _flush();
      }
      return;
    }

    console.log(`🤖 Processing batch of ${batch.length} articles (Estimated tokens: ${estimatedTokens})...`);

    currentBatchPromise = (async () => {
      try {
        let aiResponse;
        try {
          aiResponse = await processBatchWithAI(batch);
        } catch (err) {
          console.error(`⚠️ AI batch processing failed`, err.message);
          throw err;
        }

        let parsed;
        try {
          parsed = JSON.parse(aiResponse.content.replace(/```json|```/g, '').trim());
          if (!parsed.results || !Array.isArray(parsed.results)) {
             throw new Error("Invalid format: missing 'results' array");
          }
        } catch (err) {
          console.warn(`⚠️ Invalid JSON from AI for batch`);
          parsed = { results: [] };
        }

        const resultsMap = new Map();
        parsed.results.forEach(res => {
          if (res && res.id) resultsMap.set(res.id, res);
        });

        let successCount = 0;

        // Save to DB sequentially to prevent 'connectOrCreate' unique constraint race conditions
        for (const article of batch) {
          const rawArticle = article;
          const articleParsed = resultsMap.get(rawArticle.id) || { 
            categories: ['other'], entities: [], sentimentScore: 0, biasNote: '', perspectiveCountries: [] 
          };
          
          const categoryOps = (articleParsed.categories || ['other']).map(cat => ({
            where: { name: cat },
            create: { name: cat }
          }));

          try {
            await prisma.$transaction(async (tx) => {
              // Create ProcessedArticle
              await tx.processedArticle.create({
                data: {
                  rawArticleId: rawArticle.id,
                  categories: { connectOrCreate: categoryOps },
                  entities: articleParsed.entities || [],
                  sentimentScore: articleParsed.sentimentScore || null,
                  biasNote: articleParsed.biasNote || null,
                  perspectiveCountries: articleParsed.perspectiveCountries || [],
                  model: aiResponse.model,
                }
              });
            }, {
              timeout: 15000,
            });
            
            successCount++;
          } catch (err) {
            console.error(`⚠️ Failed to save processed article: ${rawArticle.title}`, err.message);
          }
        }

        // Log AI Usage ONCE per batch
        try {
          const today = new Date().toISOString().split('T')[0];
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
            }
          });
        } catch (err) {
          console.error(`⚠️ Failed to log AI usage for batch`, err.message);
        }

        console.log(`✅ Batch done: ${successCount}/${batch.length} succeeded`);

        // Add a small delay to avoid hitting RPM limits in bursts
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (err) {
        console.error('❌ Batch processing failed:', err);
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
        }
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
    }
  };
}
