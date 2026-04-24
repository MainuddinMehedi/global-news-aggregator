import { processArticleWithAI } from './client.js';
import { prisma } from '../db/client.js';

export function createArticleProcessor(batchSize = parseInt(process.env.AI_BATCH_SIZE) || 5) {
  const buffer = [];
  let processing = false;

  async function processSingle(rawArticle) {
    let aiResponse;
    try {
      aiResponse = await processArticleWithAI(rawArticle);
    } catch (err) {
      console.error(`⚠️ AI processing failed for: ${rawArticle.title}`, err.message);
      throw err;
    }

    let parsed;
    try {
      parsed = JSON.parse(aiResponse.content.replace(/```json|```/g, '').trim());
    } catch (err) {
      console.warn(`⚠️ Invalid JSON from AI for: ${rawArticle.title}`);
      parsed = { categories: ['other'], entities: [], sentimentScore: 0, biasNote: '', perspectiveCountries: [] };
    }

    // Create categories if not exist, then connect
    const categoryOps = parsed.categories.map(cat => ({
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
            entities: parsed.entities || [],
            sentimentScore: parsed.sentimentScore || null,
            biasNote: parsed.biasNote || null,
            perspectiveCountries: parsed.perspectiveCountries || [],
            model: aiResponse.model,
          }
        });

        // Log AI Usage
        const today = new Date().toISOString().split('T')[0];
        
        // Very rough cost estimate (e.g., $0.0006 per 1K tokens for LLaMA 3 70b)
        const costPer1k = 0.0006;
        const estimatedCost = (aiResponse.tokensUsed / 1000) * costPer1k;

        await tx.aiUsage.create({
          data: {
            date: today,
            provider: aiResponse.provider,
            model: aiResponse.model,
            tokensUsed: aiResponse.tokensUsed,
            estimatedCost: estimatedCost,
            success: true,
          }
        });
      });

    } catch (err) {
      console.error(`⚠️ Failed to save processed article or usage: ${rawArticle.title}`, err.message);
      throw err;
    }

    return { rawId: rawArticle.id, success: true };
  }

  async function _flush() {
    if (buffer.length === 0 || processing) return;
    processing = true;

    const batch = buffer.splice(0, batchSize);
    console.log(`🤖 Processing batch of ${batch.length} articles...`);

    try {
      const results = await Promise.allSettled(
        batch.map(article => processSingle(article))
      );

      const success = results.filter(r => r.status === 'fulfilled').length;
      console.log(`✅ Batch done: ${success}/${batch.length} succeeded`);
    } catch (err) {
      console.error('❌ Batch processing failed:', err);
    } finally {
      processing = false;
      // Auto-flush remaining if any
      if (buffer.length > 0) _flush();
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
      if (buffer.length >= batchSize && !processing) {
        _flush();
      }
    },
    async flush() {
      if (buffer.length > 0) await _flush();
    }
  };
}
