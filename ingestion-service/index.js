import { prisma } from "./db/client.js";
import fetchRSSStream from "./sources/rss.js";
import hashSnippet from "./utils/hashSnippet.js";
import normalizeUrl from "./utils/normalizeUrl.js";

const sources = [
  //   {
  //     name: "Jagonews24",
  // sourceCountry: "Bangladesh",
  //     url: "https://www.jagonews24.com/rss/rss.xml",
  //   },
  {
    name: "The Daily Star",
    sourceCountry: "Bangladesh",
    url: "https://www.thedailystar.net/frontpage/rss.xml",
  },
  // { name: "Al Jazeera", sourceCountry: "Qatar", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  //   {
  //     name: "BD24 Live",
  //     sourceCountry: "Bangladesh",
  //     url: "https://www.bd24live.com/feed",
  //   },
  //   { name: "Dhaka Tribune", sourceCountry: "Bangladesh", url: "https://www.dhakatribune.com/feed/" },
  //   {
  //     name: "UN News",
  //     sourceCountry: "Global",
  //     url: "https://news.un.org/feed/subscribe/en/news/region/global/feed/rss.xml",
  //   },
  // { name: "TechCrunch", sourceCountry: "USA", url: "https://techcrunch.com/feed/" },
];

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
      const existingUrl = await prisma.article.findUnique({
        where: { url: normUrl },
        select: { id: true },
      });
      if (existingUrl) continue;

      // Dedup 2: Content Hash (fallback)
      const hash = hashSnippet(item.title + item.contentSnippet);
      const existingHash = await prisma.article.findFirst({
        where: { contentHash: hash },
        select: { id: true },
      });
      if (existingHash) continue;

      // Save directly to DB
      item.url = normUrl;
      item.contentHash = hash;
      
      try {
        await prisma.article.create({
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
      } catch (err) {
        console.error(`- Failed to insert: ${item.title}`, err.message);
      }
    }
  }

  console.log(
    `✅ Ingestion complete in ${((Date.now() - startTime) / 1000).toFixed(1)}s`,
  );
  await prisma.$disconnect();

  //   console.log("\n\n=== All Fetched Items ===");
  //   console.log("first item - ", allItems);
  console.log("Total items fetched - ", allItems.length);
}

run().catch((err) => console.error("Worker encountered an error:", err));
