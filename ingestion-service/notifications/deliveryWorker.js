import { prisma } from "../db/prisma.js";
import { claimPendingDeliveries, markDelivered, markFailed } from "./queue.js";
import { deliverDiscord } from "./channels/discord.js";
import { deliverTelegram } from "./channels/telegram.js";
import { deliverInApp } from "./channels/inApp.js";

export async function processDeliveryBatch() {
  const deliveries = await claimPendingDeliveries(50);
  
  if (deliveries.length === 0) return;
  console.log(`[Notification Delivery] Processing batch of ${deliveries.length} pending deliveries...`);

  // Fetch admin configs once for the batch
  const adminConfigs = await prisma.adminNotificationConfig.findMany();
  const configMap = new Map(adminConfigs.map(c => [c.type, c]));

  const ADMIN_NOTIFICATION_TYPES = [
    'PIPELINE_FAILURE',
    'INGESTION_STALLED',
    'HIGH_FAILURE_RATE',
    'AI_PROVIDER_DEGRADED',
    'REVALIDATION_FAILED',
    'TOPIC_SOURCE_DEGRADED'
  ];

  // Batch-fetch non-admin notification user preferences to prevent N+1 queries
  const userIds = [
    ...new Set(
      deliveries
        .filter(d => !ADMIN_NOTIFICATION_TYPES.includes(d.notification.type) && d.notification.userId)
        .map(d => d.notification.userId)
    )
  ];

  let prefMap = new Map();
  if (userIds.length > 0) {
    const prefs = await prisma.notificationPreference.findMany({
      where: { userId: { in: userIds } }
    });
    prefMap = new Map(prefs.map(p => [p.userId, p]));
  }

  for (const delivery of deliveries) {
    const { notification, channel } = delivery;

    try {
      const isAdmin = ADMIN_NOTIFICATION_TYPES.includes(notification.type);
      let targetWebhook = null;
      let targetChatId = null;

      if (isAdmin) {
        const config = configMap.get(notification.type);
        if (channel === 'DISCORD') {
          targetWebhook =
            config?.discordWebhook ||
            process.env.ADMIN_DISCORD_WEBHOOK ||
            process.env.DISCORD_WEBHOOK_URL;
        }
        if (channel === 'TELEGRAM') {
          targetChatId =
            config?.telegramChatId || process.env.ADMIN_TELEGRAM_CHAT_ID;
        }
      } else {
        const pref = prefMap.get(notification.userId);
        if (channel === 'DISCORD') targetWebhook = pref?.discordWebhook;
        if (channel === 'TELEGRAM') targetChatId = pref?.telegramChatId;
      }
      
      switch (channel) {
        case 'IN_APP':
          await deliverInApp(notification);
          break;
        case 'DISCORD':
          if (!targetWebhook) throw new Error("Discord webhook URL not configured");
          await deliverDiscord(notification, targetWebhook);
          break;
        case 'TELEGRAM':
          if (!targetChatId) throw new Error("Telegram chat ID not configured");
          const botToken = process.env.TELEGRAM_BOT_TOKEN;
          if (!botToken) throw new Error("Telegram bot token (TELEGRAM_BOT_TOKEN) is not configured in process environment");
          await deliverTelegram(notification, targetChatId, botToken);
          break;
        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }

      await markDelivered(delivery.id);
      
    } catch (err) {
      console.error(`[Notification Delivery] Failed to deliver notification ${notification.id} via ${channel}:`, err.message);
      await markFailed(delivery.id, err);
    }
  }
}
