"use server";

import prisma from "@/lib/prisma";
import { FeedSource } from "@news/db";
import { revalidateTag } from "next/cache";
import { verifyAdmin } from "./varifyAdmin";

export async function toggleFeedSource(id: string, enabled: boolean) {
  await verifyAdmin();

  try {
    const feed = await prisma.feedSource.update({
      where: { id },
      data: { enabled },
    });

    revalidateTag("articles", "max");
    return { success: true, feed };
  } catch (error: any) {
    console.error("toggleFeedSource error:", error);
    return { success: false, error: error.message };
  }
}

export async function resetFeedFailures(id: string) {
  await verifyAdmin();

  try {
    const feed = await prisma.feedSource.update({
      where: { id },
      data: { fetchFailures: 0 },
    });

    return { success: true, feed };
  } catch (error: any) {
    console.error("resetFeedFailures error:", error);
    return { success: false, error: error.message };
  }
}

export async function resetAllFeedFailures() {
  await verifyAdmin();

  try {
    await prisma.feedSource.updateMany({
      data: { fetchFailures: 0 },
    });

    return { success: true };
  } catch (error: any) {
    console.error("resetAllFeedFailures error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteFeedSource(id: string) {
  await verifyAdmin();

  try {
    await prisma.feedSource.delete({
      where: { id },
    });

    return { success: true };
  } catch (error: any) {
    console.error("deleteFeedSource error:", error);
    return { success: false, error: error.message };
  }
}

export async function saveFeedSource(data: {
  id?: string;
  name: string;
  url: string;
  sourceCountry: string;
  sourceType: string;
  biasGroup: string;
  coverageScope: string;
}) {
  await verifyAdmin();

  try {
    const { id, ...payload } = data;
    let feed: FeedSource;

    if (id) {
      feed = await prisma.feedSource.update({
        where: { id },
        data: payload,
      });
    } else {
      feed = await prisma.feedSource.create({
        data: {
          ...payload,
          enabled: true,
          fetchFailures: 0,
        },
      });

      try {
        const users = await prisma.user.findMany({
          select: { id: true },
        });

        if (users.length > 0) {
          await prisma.notification.createMany({
            data: users.map((u) => ({
              userId: u.id,
              type: "NEW_SOURCE_ADDED",
              title: `📡 New Feed Source: ${feed.name}`,
              message: `A new news feed source "${feed.name}" (${feed.url}) has been added to the system.`,
              priority: "NORMAL",
              channels: ["IN_APP"],
              payload: {
                sourceName: feed.name,
                sourceUrl: feed.url,
              },
            })),
          });
        }
      } catch (broadcastError: any) {
        console.error(
          "Failed to broadcast NEW_SOURCE_ADDED notification:",
          broadcastError,
        );
        // Do not fail the main saveFeedSource operation if broadcast fails
      }
    }

    revalidateTag("articles", "max");
    return { success: true, feed };
  } catch (error: any) {
    console.error("saveFeedSource error:", error);
    return { success: false, error: error.message };
  }
}

export async function seedFeedSources() {
  await verifyAdmin();

  try {
    const fs = await import("fs");
    const path = await import("path");
    const feedsPath = path.join(
      process.cwd(),
      "..",
      "ingestion-service",
      "data",
      "feeds.json",
    );
    const builtinFeeds = JSON.parse(fs.readFileSync(feedsPath, "utf8")) as Omit<
      FeedSource,
      "id" | "fetchFailures" | "lastFetchedAt" | "createdAt" | "updatedAt"
    >[];

    const existing = await prisma.feedSource.findMany({
      select: { url: true },
    });
    const existingUrls = new Set(existing.map((f) => f.url));

    const toInsert = builtinFeeds.filter(
      (f) => f.url && !existingUrls.has(f.url),
    );

    if (toInsert.length === 0) {
      return { success: true, seeded: 0 };
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
    }

    revalidateTag("articles", "max");
    return { success: true, seeded: toInsert.length };
  } catch (error: any) {
    console.error("seedFeedSources error:", error);
    return { success: false, error: error.message };
  }
}
