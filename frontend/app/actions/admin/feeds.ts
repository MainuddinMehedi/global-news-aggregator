"use server";

import prisma from "@/lib/prisma";
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
    let feed;
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
    const { default: builtinFeeds } = await import("../../../../ingestion-service/data/builtin-feeds.js");

    const existing = await prisma.feedSource.findMany({
      select: { url: true },
    });
    const existingUrls = new Set(existing.map((f) => f.url));

    const toInsert = builtinFeeds.filter((f) => !existingUrls.has(f.url));

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
    // TODO: Notifications — broadcast to all users when new feeds are seeded
    return { success: true, seeded: toInsert.length };
  } catch (error: any) {
    console.error("seedFeedSources error:", error);
    return { success: false, error: error.message };
  }
}
