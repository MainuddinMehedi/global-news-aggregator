import { prisma } from "../ingestion-service/db/prisma.js";

const builtinFeeds = [
  // ── Bangladesh ───────────────────────────────────────────
  {
    name: "The Daily Star",
    sourceCountry: "Bangladesh",
    sourceType: "Commercial Publisher",
    biasGroup: "Centrist",
    coverageScope: "National",
    url: "https://www.thedailystar.net/frontpage/rss.xml",
    enabled: true,
  },
  {
    name: "Dhaka Tribune",
    sourceCountry: "Bangladesh",
    sourceType: "Commercial Publisher",
    biasGroup: "Centrist",
    coverageScope: "National",
    url: "https://www.dhakatribune.com/feed/",
    enabled: true,
  },
  {
    name: "BD24 Live",
    sourceCountry: "Bangladesh",
    sourceType: "Commercial Publisher",
    biasGroup: "Centrist",
    coverageScope: "National",
    url: "https://www.bd24live.com/feed",
    enabled: true,
  },
  {
    name: "Jagonews24",
    sourceCountry: "Bangladesh",
    sourceType: "Commercial Publisher",
    biasGroup: "Centrist",
    coverageScope: "National",
    url: "https://www.jagonews24.com/rss/rss.xml",
    enabled: false,
  },

  // ── International ────────────────────────────────────────
  {
    name: "Al Jazeera",
    sourceCountry: "Qatar",
    sourceType: "State Media",
    biasGroup: "State-Aligned",
    coverageScope: "Global",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    enabled: true,
  },
  {
    name: "UN News",
    sourceCountry: "Global",
    sourceType: "Independent Wire",
    biasGroup: "Centrist",
    coverageScope: "Global",
    url: "https://news.un.org/feed/subscribe/en/news/region/global/feed/rss.xml",
    enabled: true,
  },
  {
    name: "TechCrunch",
    sourceCountry: "USA",
    sourceType: "Commercial Publisher",
    biasGroup: "Centrist",
    coverageScope: "Global",
    url: "https://techcrunch.com/feed/",
    enabled: true,
  },
];

async function main() {
  console.log("🌱 Seeding FeedSource records into database...");
  for (const feed of builtinFeeds) {
    const result = await prisma.feedSource.upsert({
      where: { url: feed.url },
      update: {
        name: feed.name,
        sourceCountry: feed.sourceCountry,
        sourceType: feed.sourceType,
        biasGroup: feed.biasGroup,
        coverageScope: feed.coverageScope,
        enabled: feed.enabled,
      },
      create: {
        name: feed.name,
        url: feed.url,
        sourceCountry: feed.sourceCountry,
        sourceType: feed.sourceType,
        biasGroup: feed.biasGroup,
        coverageScope: feed.coverageScope,
        enabled: feed.enabled,
      },
    });
    console.log(`Upserted feed: ${result.name} (${result.url}) -> Enabled: ${result.enabled}`);
  }
  console.log("✅ Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
