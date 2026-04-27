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

import 'dotenv/config';
import { prisma } from "./db/client.js";
import { createArticleProcessor } from "./ai/processor.js";

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1]) : undefined;

const startTime = Date.now();

async function processBacklog() {
  // Find RawArticles that have no ProcessedArticle
  const unprocessed = await prisma.rawArticle.findMany({
    where: {
      processedArticle: null,
    },
    orderBy: { publishedAt: "desc" },
    ...(limit ? { take: limit } : {}),
  });

  if (unprocessed.length === 0) {
    console.log("✅ No unprocessed articles found. Backlog is clear!");
    await prisma.$disconnect();
    return;
  }

  console.log(`📋 Found ${unprocessed.length} unprocessed articles${limit ? ` (limit: ${limit})` : ""}\n`);

  const aiProcessor = createArticleProcessor();

  let queued = 0;
  for (const article of unprocessed) {
    await aiProcessor.add(article);
    queued++;
  }

  console.log(`\n🤖 Flushing AI tasks for ${queued} articles...`);
  await aiProcessor.flush();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ Backlog processing complete in ${elapsed}s`);
  console.log(`   🤖 Processed: ${queued} articles`);
  console.log(`${"─".repeat(50)}\n`);

  await prisma.$disconnect();
}

processBacklog().catch((err) => {
  console.error("Backlog processor encountered an error:", err);
  process.exit(1);
});
