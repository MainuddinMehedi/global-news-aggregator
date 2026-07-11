import prisma from "@/lib/prisma";
import { cache } from "react";

/**
 * Cached function to get all global feed sources.
 * It queries the FeedSource table for enabled sources.
 */
export const getCachedFeedSources = cache(async () => {
  try {
    const systemFeeds = await prisma.feedSource.findMany({
      // If an admin disables a source globally, it is treated as "deleted" from the user's perspective.
      // It should not be visible anywhere in the client UI.
      where: { enabled: true },
    });

    return systemFeeds;
  } catch (error) {
    console.error("Failed to fetch feed sources from database:", error);
    return [];
  }
});
