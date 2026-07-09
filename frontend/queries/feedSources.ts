import { BUILTIN_SOURCES } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { FeedSource } from "@news/db";
import { cache } from "react";

/**
 * Cached function to get all global feed sources.
 * It queries the FeedSource table and falls back to BUILTIN_SOURCES
 * if the database table is empty.
 */
export const getCachedFeedSources = cache(async () => {
  try {
    const systemFeeds = await prisma.feedSource.findMany({
      where: { enabled: true }, // We only want to show enabled ones in Settings, or all of them?
      // Wait, if an admin disables a source globally, it shouldn't show up for users.
      // But let's fetch all for safety, and filter later or return all so users see what exists.
      // Let's just fetch all global feeds.
    });

    if (!systemFeeds || systemFeeds.length === 0) {
      return BUILTIN_SOURCES.map((source) => ({
        id: source.id,
        name: source.name,
        url: source.url,
        sourceCountry: source.country,
        sourceType: source.sourceType,
        biasGroup: source.biasGroup,
        coverageScope: source.coverageScope,
        enabled: source.enabled,
        fetchFailures: 0,
        lastFetchedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as FeedSource[];
    }

    return systemFeeds;
  } catch (error) {
    console.error("Failed to fetch feed sources from database:", error);

    return BUILTIN_SOURCES.map((source) => ({
      id: source.id,
      name: source.name,
      url: source.url,
      sourceCountry: source.country,
      sourceType: source.sourceType,
      biasGroup: source.biasGroup,
      coverageScope: source.coverageScope,
      enabled: source.enabled,
      fetchFailures: 0,
      lastFetchedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as FeedSource[];
  }
});
