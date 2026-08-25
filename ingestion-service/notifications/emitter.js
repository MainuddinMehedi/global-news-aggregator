import { prisma } from "../db/prisma.js";
import { enqueueNotification } from "./queue.js";
import * as templates from "./templates.js";

/**
 * Emits a notification to a specific user.
 */
export async function emitNotification({
  userId,
  type,
  title,
  message,
  priority,
  payload,
  channels,
}) {
  try {
    // 1. Resolve channels from NotificationPreference if not specified or validate explicit channels
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    let resolvedChannels = [];
    if (!channels || channels.length === 0) {
      resolvedChannels.push("IN_APP");
      if (pref?.discordEnabled && pref?.discordWebhook) {
        resolvedChannels.push("DISCORD");
      }
      if (pref?.telegramEnabled && pref?.telegramChatId) {
        resolvedChannels.push("TELEGRAM");
      }
    } else {
      // Validate requested channels against actual user configured endpoints
      for (const ch of channels) {
        if (ch === "IN_APP") {
          resolvedChannels.push("IN_APP");
        } else if (ch === "DISCORD" && pref?.discordWebhook) {
          resolvedChannels.push("DISCORD");
        } else if (ch === "TELEGRAM" && pref?.telegramChatId) {
          resolvedChannels.push("TELEGRAM");
        }
      }
      if (resolvedChannels.length === 0) {
        resolvedChannels.push("IN_APP");
      }
    }

    // 2. Resolve title and message from templates if missing
    let resolvedTitle = title;
    let resolvedMessage = message;
    if (!resolvedTitle || !resolvedMessage) {
      let formatted;
      switch (type) {
        case "TOPIC_FINDING_ALERT":
          formatted = templates.formatTopicFindingAlert(payload);
          break;
        case "TOPIC_FINDING_DIGEST":
          formatted = templates.formatTopicFindingDigest(payload);
          break;
        case "SYSTEM_NEWS_DIGEST":
          formatted = templates.formatSystemNewsDigest(payload);
          break;
        case "TOPIC_SOURCE_DEGRADED":
          formatted = templates.formatTopicSourceDegraded(payload);
          break;
        case "TOPIC_SCAN_DEGRADED":
          formatted = templates.formatTopicScanDegraded(payload);
          break;
        case "NEW_SOURCE_ADDED":
          formatted = templates.formatNewSourceAdded(payload);
          break;
        default:
          formatted = {
            title: title || `Alert: ${type}`,
            message: message || JSON.stringify(payload),
          };
      }
      resolvedTitle = formatted.title;
      resolvedMessage = formatted.message;
    }

    const notification = await enqueueNotification({
      userId,
      type,
      title: resolvedTitle,
      message: resolvedMessage,
      priority: priority || "NORMAL",
      payload: payload || {},
      channels: resolvedChannels,
    });
    console.log(`[Notification Engine] Emitted ${type} for user ${userId}`);
    return notification;
  } catch (err) {
    console.error(
      `[Notification Engine] Failed to emit ${type} for user ${userId}:`,
      err.message,
    );
  }
}

/**
 * Emits an admin-level notification.
 * Resolves all users with ADMIN role and applies cooldown logic.
 */
export async function emitAdminNotification(type, payload) {
  try {
    // 1. Fetch config for this notification type
    const config = await prisma.adminNotificationConfig.findUnique({
      where: { type },
    });

    if (!config) {
      console.warn(
        `[Notification Engine] No AdminNotificationConfig found for type ${type}`,
      );
      return;
    }

    // 2. Check Cooldown
    if (config.cooldownMinutes > 0) {
      const cooldownWindow = new Date(
        Date.now() - config.cooldownMinutes * 60 * 1000,
      );
      const recentNotification = await prisma.notification.findFirst({
        where: {
          type,
          createdAt: { gte: cooldownWindow },
        },
      });

      if (recentNotification) {
        console.log(
          `[Notification Engine] Admin notification ${type} suppressed by cooldown.`,
        );
        return;
      }
    }

    // 3. Resolve Channels
    const adminDiscordWebhook =
      config.discordWebhook ||
      process.env.ADMIN_DISCORD_WEBHOOK ||
      process.env.DISCORD_WEBHOOK_URL;
    const adminTelegramChatId =
      config.telegramChatId || process.env.ADMIN_TELEGRAM_CHAT_ID;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    const channels = [];
    if (config.inAppEnabled) channels.push("IN_APP");
    if (config.discordEnabled && adminDiscordWebhook) channels.push("DISCORD");
    if (config.telegramEnabled && adminTelegramChatId && botToken)
      channels.push("TELEGRAM");

    if (channels.length === 0) return;

    // 4. Format Message using templates
    let formatted;
    switch (type) {
      case "PIPELINE_FAILURE":
        formatted = templates.formatPipelineFailure(payload);
        break;
      case "INGESTION_STALLED":
        formatted = templates.formatIngestionStalled(payload);
        break;
      case "HIGH_FAILURE_RATE":
        formatted = templates.formatHighFailureRate(payload);
        break;
      case "AI_PROVIDER_DEGRADED":
        formatted = templates.formatAiProviderDegraded(payload);
        break;
      case "REVALIDATION_FAILED":
        formatted = templates.formatRevalidationFailed(payload);
        break;
      case "TOPIC_SOURCE_DEGRADED":
        formatted = templates.formatTopicSourceDegraded(payload);
        break;
      case "NEW_SOURCE_ADDED":
        formatted = templates.formatNewSourceAdded(payload);
        break;
      default:
        formatted = {
          title: `Admin Alert: ${type}`,
          message: JSON.stringify(payload),
        };
    }

    // 5. Find all Admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length === 0) {
      console.warn(
        `[Notification Engine] No ADMIN users found to receive ${type}`,
      );
      return;
    }

    // 6. Enqueue for each Admin
    for (const admin of admins) {
      await enqueueNotification({
        userId: admin.id,
        type,
        title: formatted.title,
        message: formatted.message,
        priority: "HIGH", // Admin alerts are always HIGH for now
        payload,
        channels,
      });
    }

    console.log(
      `[Notification Engine] Emitted Admin Alert ${type} to ${admins.length} admins.`,
    );
  } catch (err) {
    console.error(
      `[Notification Engine] Failed to emit admin notification ${type}:`,
      err,
    );
  }
}
