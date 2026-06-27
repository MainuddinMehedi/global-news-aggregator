import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NotificationType } from "@news/db";
import { revalidateTag } from "next/cache";
import { isValidDiscordWebhook, isValidTelegramChatId } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const configs = await prisma.adminNotificationConfig.findMany({
      orderBy: {
        type: "asc",
      },
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error("Error fetching admin notification configs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      type,
      inAppEnabled,
      discordEnabled,
      telegramEnabled,
      discordWebhook,
      telegramChatId,
      cooldownMinutes,
    } = body as {
      type: NotificationType;
      inAppEnabled?: boolean;
      discordEnabled?: boolean;
      telegramEnabled?: boolean;
      discordWebhook?: string | null;
      telegramChatId?: string | null;
      cooldownMinutes?: number;
    };

    if (!type) {
      return NextResponse.json({ error: "Missing config type" }, { status: 400 });
    }

    if (!Object.values(NotificationType).includes(type)) {
      return NextResponse.json({ error: "Invalid config type" }, { status: 400 });
    }

    // Discord Webhook Validation
    if (discordEnabled && discordWebhook) {
      if (!isValidDiscordWebhook(discordWebhook)) {
        return NextResponse.json(
          { error: "Invalid Discord Webhook URL. Must start with https://discord.com or https://discordapp.com" },
          { status: 400 }
        );
      }
    }

    // Telegram Chat ID Validation
    if (telegramEnabled && telegramChatId) {
      if (!isValidTelegramChatId(telegramChatId)) {
        return NextResponse.json(
          { error: "Invalid Telegram Chat ID. Must be a numeric string." },
          { status: 400 }
        );
      }
    }

    // Cooldown Validation
    if (cooldownMinutes !== undefined) {
      if (!Number.isInteger(cooldownMinutes) || cooldownMinutes < 0) {
        return NextResponse.json(
          { error: "Cooldown minutes must be a non-negative integer" },
          { status: 400 }
        );
      }
    }

    const updatedConfig = await prisma.adminNotificationConfig.update({
      where: { type },
      data: {
        inAppEnabled,
        discordEnabled,
        telegramEnabled,
        discordWebhook: discordEnabled ? (discordWebhook || null) : null,
        telegramChatId: telegramEnabled ? (telegramChatId || null) : null,
        cooldownMinutes,
      },
    });

    revalidateTag("admin-notification-configs", "max");

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error("Error updating admin notification config:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
