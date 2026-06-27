import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting settings migration to NotificationPreference...");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      settings: true,
    },
  });

  console.log(`Found ${users.length} users to inspect.`);

  let migratedCount = 0;

  for (const user of users) {
    if (!user.settings || typeof user.settings !== "object") {
      continue;
    }

    const settings = user.settings as Record<string, any>;
    const channels = settings.notificationChannels;

    if (!channels) {
      continue;
    }

    console.log(`Migrating settings for user: ${user.email || user.id}`);

    const discordEnabled = !!channels.discord;
    const telegramEnabled = !!channels.telegram;
    const discordWebhook = channels.discord || null;
    const telegramChatId = channels.telegram || null;
    const digestEnabled = channels.mode === "digest";

    // 1. Upsert NotificationPreference
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        inAppEnabled: true,
        discordEnabled,
        telegramEnabled,
        discordWebhook,
        telegramChatId,
        digestEnabled,
      },
      update: {
        discordEnabled,
        telegramEnabled,
        discordWebhook,
        telegramChatId,
        digestEnabled,
      },
    });

    // 2. Clean up User.settings
    const updatedSettings = { ...settings };
    delete updatedSettings.notificationChannels;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        settings: updatedSettings,
      },
    });

    migratedCount++;
  }

  console.log(`✅ Settings migration complete. Migrated ${migratedCount} users.`);
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
