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

  for (const delivery of deliveries) {
    const { notification, channel } = delivery;

    try {
      // Admin notifications use global AdminNotificationConfig
      // For now all notifications processed here are Admin, but we'll check it anyway
      const config = configMap.get(notification.type);
      
      switch (channel) {
        case 'IN_APP':
          await deliverInApp(notification);
          break;
        case 'DISCORD':
          if (!config?.discordWebhook) throw new Error("Discord webhook URL not configured");
          await deliverDiscord(notification, config.discordWebhook);
          break;
        case 'TELEGRAM':
          if (!config?.telegramChatId) throw new Error("Telegram chat ID not configured");
          // NOTE: Bot token should be in environment variables
          const botToken = process.env.TELEGRAM_BOT_TOKEN;
          await deliverTelegram(notification, config.telegramChatId, botToken);
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
