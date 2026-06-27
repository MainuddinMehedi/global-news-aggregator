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
    console.log("✅ All defaults already present — no new feeds to seed.");
  } else {
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

  console.log("\n🌱 Seeding AdminNotificationConfig records into database...");
  const adminConfigs = [
    { type: 'PIPELINE_FAILURE',      inAppEnabled: true, discordEnabled: true,  cooldownMinutes: 60 },
    { type: 'INGESTION_STALLED',     inAppEnabled: true, discordEnabled: true,  cooldownMinutes: 60 },
    { type: 'HIGH_FAILURE_RATE',     inAppEnabled: true, discordEnabled: true,  cooldownMinutes: 60 },
    { type: 'AI_PROVIDER_DEGRADED',  inAppEnabled: true, discordEnabled: true,  cooldownMinutes: 60 },
    { type: 'REVALIDATION_FAILED',   inAppEnabled: true, discordEnabled: false, cooldownMinutes: 60 },
    { type: 'TOPIC_SOURCE_DEGRADED', inAppEnabled: true, discordEnabled: false, cooldownMinutes: 60 },
  ];

  for (const config of adminConfigs) {
    await prisma.adminNotificationConfig.upsert({
      where: { type: config.type },
      update: {}, 
      create: config,
    });
  }
  console.log(`✅ Seeded/verified admin notification configurations.`);

  console.log("\n🌱 Seeding default NotificationPreference records for users...");
  const users = await prisma.user.findMany({
    include: { notificationPreference: true }
  });

  let createdPrefCount = 0;
  for (const user of users) {
    if (!user.notificationPreference) {
      await prisma.notificationPreference.create({
        data: {
          userId: user.id,
          inAppEnabled: true,
          discordEnabled: false,
          telegramEnabled: false,
        }
      });
      createdPrefCount++;
    }
  }
  console.log(`✅ Verified/created default preferences for ${createdPrefCount} user(s).`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
