"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";

import { isValidDiscordWebhook, isValidTelegramChatId } from "@/lib/validation";

export interface SaveNotificationPreferenceInput {
  inAppEnabled: boolean;
  discordEnabled: boolean;
  telegramEnabled: boolean;
  discordWebhook?: string | null;
  telegramChatId?: string | null;
  digestEnabled: boolean;
}

/**
 * Gets the current user's NotificationPreference row.
 * Upserts a default record if one doesn't already exist.
 */
export async function getNotificationPreferenceAction() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  let preference = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (!preference) {
    preference = await prisma.notificationPreference.create({
      data: {
        userId,
        inAppEnabled: true,
        discordEnabled: false,
        telegramEnabled: false,
        digestEnabled: false,
      },
    });
  }

  return preference;
}

/**
 * Saves the current user's NotificationPreference.
 */
export async function saveNotificationPreferenceAction(input: SaveNotificationPreferenceInput) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  // Enforce basic URL validation on user Discord webhook if enabled
  if (input.discordEnabled && input.discordWebhook) {
    if (!isValidDiscordWebhook(input.discordWebhook)) {
      throw new Error("Invalid Discord Webhook URL. Must start with https://discord.com or https://discordapp.com");
    }
  }

  // Enforce basic numeric check on user Telegram Chat ID if enabled
  if (input.telegramEnabled && input.telegramChatId) {
    if (!isValidTelegramChatId(input.telegramChatId)) {
      throw new Error("Invalid Telegram Chat ID. Must be a numeric string.");
    }
  }

  const preference = await prisma.notificationPreference.upsert({
    where: { userId },
    create: {
      userId,
      inAppEnabled: input.inAppEnabled,
      discordEnabled: input.discordEnabled,
      telegramEnabled: input.telegramEnabled,
      discordWebhook: input.discordWebhook || null,
      telegramChatId: input.telegramChatId || null,
      digestEnabled: input.digestEnabled,
    },
    update: {
      inAppEnabled: input.inAppEnabled,
      discordEnabled: input.discordEnabled,
      telegramEnabled: input.telegramEnabled,
      discordWebhook: input.discordEnabled ? (input.discordWebhook || null) : null,
      telegramChatId: input.telegramEnabled ? (input.telegramChatId || null) : null,
      digestEnabled: input.digestEnabled,
    },
  });

  revalidateTag(`notifications-${userId}`, "max");

  return preference;
}
