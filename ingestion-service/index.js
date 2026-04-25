import { prisma } from "./db/client.js";
import fetchRSSStream from "./sources/rss.js";
import { getActiveFeeds } from "./sources/feeds.js";
import hashSnippet from "./utils/hashSnippet.js";
import normalizeUrl from "./utils/normalizeUrl.js";
import { createArticleProcessor } from "./ai/processor.js";

const aiProcessor = createArticleProcessor();
const sources = getActiveFeeds();

const startTime = Date.now();

async function run() {
  const allItems = [];

  for (const src of sources) {
    console.log(`\n📡 Streaming..: ${src.name} (${src.sourceCountry})\n`);

    for await (const item of fetchRSSStream(
      src.name,
      src.sourceCountry,
      src.url,
    )) {
      allItems.push(item);

      const normUrl = normalizeUrl(item.url);
      if (!normUrl) continue;

      //   console.log(`- ${normUrl} \n`);

      // Dedup 1: URL
      const existingUrl = await prisma.rawArticle.findUnique({
        where: { url: normUrl },
        select: { id: true },
      });
      if (existingUrl) continue;

      // Dedup 2: Content Hash (fallback)
      const hash = hashSnippet(item.title + item.contentSnippet);
      const existingHash = await prisma.rawArticle.findFirst({
        where: { contentHash: hash },
        select: { id: true },
      });
      if (existingHash) continue;

      // Save directly to DB
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
            publishedAt: item.publishedAt,
            contentHash: item.contentHash,
          },
        });
        console.log(`+ Inserted: ${item.title}`);
        
        // Add to AI Processing Queue
        await aiProcessor.add(rawArticle);
      } catch (err) {
        console.error(`- Failed to insert: ${item.title}`, err.message);
      }
    }
  }

  console.log('🤖 Flushing remaining AI tasks...');
  await aiProcessor.flush();

  console.log(
    `✅ Ingestion complete in ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
  );
  await prisma.$disconnect();

  //   console.log("\n\n=== All Fetched Items ===");
  //   console.log("first item - ", allItems);
  console.log("Total items fetched - ", allItems.length);
}

run().catch((err) => console.error("Worker encountered an error:", err));
