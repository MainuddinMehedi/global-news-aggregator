import { prisma } from "../ingestion-service/db/prisma.js";
import builtinFeeds from "../ingestion-service/data/builtin-feeds.js";

async function main() {
  console.log("🌱 Seeding FeedSource records into database...");

  const existingFeeds = await prisma.feedSource.findMany({
    select: { url: true },
  });
  const existingUrls = new Set(existingFeeds.map((f) => f.url));

  const toInsert = builtinFeeds.filter((f) => !existingUrls.has(f.url));

  if (toInsert.length === 0) {
    console.log("✅ All defaults already present — nothing to seed.");
    return;
  }

  for (const feed of toInsert) {
    await prisma.feedSource.create({
      data: {
        name: feed.name,
        url: feed.url,
        sourceCountry: feed.sourceCountry,
        sourceType: feed.sourceType,
        biasGroup: feed.biasGroup,
        coverageScope: feed.coverageScope,
        enabled: feed.enabled,
      },
    });
    console.log(`Seeded: ${feed.name} (${feed.url})`);
  }

  console.log(`✅ Seeded ${toInsert.length} new feed source(s).`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
