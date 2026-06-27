import { prisma } from "../db/prisma.js";
import builtinFeeds from "./builtin-feeds.js";

/** Returns only feeds where `enabled` is true across all users or defaults. */
export async function getActiveFeeds() {
  const allFeeds = await getAllFeeds();
  return allFeeds.filter((f) => f.enabled);
}

/** Returns all feeds regardless of enabled status, merged from users and database FeedSource. */
export async function getAllFeeds() {
  let systemFeeds = [];
  try {
    systemFeeds = await prisma.feedSource.findMany();
  } catch (err) {
    console.warn(
      "Could not fetch FeedSource from DB, falling back to static list:",
      err.message,
    );
  }

  // Fallback to static list if database query fails or returned no records (e.g., unseeded)
  if (!systemFeeds || systemFeeds.length === 0) {
    systemFeeds = builtinFeeds;
  }

  let users = [];
  try {
    users = await prisma.user.findMany({ select: { settings: true } });
  } catch (err) {
    console.warn("Could not fetch users for custom feeds:", err.message);
  }

  const feedsMap = new Map();

  // Load system feeds (from DB or fallback)
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

  // Load user custom feeds
  for (const user of users) {
    if (user.settings && Array.isArray(user.settings.customSources)) {
      for (const src of user.settings.customSources) {
        if (!feedsMap.has(src.url)) {
          feedsMap.set(src.url, {
            name: src.name,
            sourceCountry: src.country,
            sourceType: src.sourceType || "Other",
            biasGroup: src.biasGroup,
            coverageScope: src.coverageScope,
            url: src.url,
            enabled: src.enabled === true,
          });
        } else {
          // If any user has it enabled, ensure global ingestion is enabled
          if (src.enabled === true) {
            feedsMap.get(src.url).enabled = true;
          }
        }
      }
    }
  }

  return Array.from(feedsMap.values());
}

export default builtinFeeds;
