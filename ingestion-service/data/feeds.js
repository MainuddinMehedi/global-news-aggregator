import { prisma } from "../db/prisma.js";

/** Returns only feeds where `enabled` is true across all defaults or DB config. */
export async function getActiveFeeds() {
  const allFeeds = await getAllFeeds();
  return allFeeds.filter((f) => f.enabled);
}

/** Returns all feeds regardless of enabled status from database FeedSource. */
export async function getAllFeeds() {
  const systemFeeds = await prisma.feedSource.findMany();

  const feedsMap = new Map();

  for (const f of systemFeeds) {
    feedsMap.set(f.url, {
      name: f.name,
      sourceCountry: f.sourceCountry,
      sourceType: f.sourceType,
      biasGroup: f.biasGroup,
      coverageScope: f.coverageScope,
      url: f.url,
      enabled: f.enabled,
    });
  }

  return Array.from(feedsMap.values());
}
