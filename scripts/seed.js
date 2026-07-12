import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../ingestion-service/db/prisma.js";
import { NotificationType } from "../shared/prisma-client/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🌱 Starting Database Seeding...\n");

  // 1. Seed Categories --------------------------------------------------
  const canonicalPath = path.join(
    __dirname,
    "../frontend/constants/canonical.json",
  );
  const canonicalData = JSON.parse(fs.readFileSync(canonicalPath, "utf8"));

  console.log(`📌 Seeding Categories (${canonicalData.categories.length})...`);
  let categoryCount = 0;

  for (const category of canonicalData.categories) {
    await prisma.category.upsert({
      where: { name: category },
      update: {},
      create: { name: category },
    });
    categoryCount++;
  }

  console.log(`✅ Seeded ${categoryCount} categories.\n`);

  // 2. Seed FeedSources -------------------------------------------------
  const feedsPath = path.join(
    __dirname,
    "../ingestion-service/data/feeds.json",
  );
  const feedsData = JSON.parse(fs.readFileSync(feedsPath, "utf8"));

  console.log(`📌 Seeding FeedSources (${feedsData.length})...`);
  let feedCount = 0;

  for (const feed of feedsData) {
    await prisma.feedSource.upsert({
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
    feedCount++;
  }
  console.log(`✅ Seeded ${feedCount} feed sources.\n`);

  // 3. Seed System Settings ----------------------------------------------
  const settingsPath = path.join(
    __dirname,
    "../ingestion-service/data/system-settings.json",
  );
  const settingsData = JSON.parse(fs.readFileSync(settingsPath, "utf8"));

  console.log(`📌 Seeding System Settings...`);
  for (const [key, value] of Object.entries(settingsData)) {
    await prisma.systemSetting.upsert({
      where: { key: key },
      update: { value: value },
      create: {
        key: key,
        value: value,
        description: "Default AI Configuration",
      },
    });
  }
  console.log(`✅ Seeded system settings.\n`);

  // 4. Seed AdminNotificationConfig Defaults ----------------------------------------------
  console.log(`📌 Seeding AdminNotificationConfig...`);

  const notificationTypes = Object.values(NotificationType);
  let notifCount = 0;

  for (const type of notificationTypes) {
    await prisma.adminNotificationConfig.upsert({
      where: { type: type },
      update: {},
      create: {
        type: type,
        inAppEnabled: true,
        discordEnabled: false,
        telegramEnabled: false,
        cooldownMinutes: 60,
      },
    });
    notifCount++;
  }
  console.log(`✅ Seeded ${notifCount} admin notification configs.\n`);

  console.log("🌟 Seeding Complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
