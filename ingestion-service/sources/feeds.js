/**
 * RSS feed sources for the ingestion pipeline.
 *
 * Each entry must have:
 *   - name:          Human-readable source name
 *   - sourceCountry: Country of origin (or "Global")
 *   - url:           RSS/Atom feed URL
 *   - enabled:       Set to false to skip without deleting the entry
 */

import { prisma } from "../db/prisma.js";

const builtinFeeds = [
  // ── Bangladesh ───────────────────────────────────────────
  { name: "The Daily Star", sourceCountry: "Bangladesh", sourceOrigin: "Asia-Pacific", sourceType: "Commercial Publisher", url: "https://www.thedailystar.net/frontpage/rss.xml", enabled: true },
  { name: "Dhaka Tribune", sourceCountry: "Bangladesh", sourceOrigin: "Asia-Pacific", sourceType: "Commercial Publisher", url: "https://www.dhakatribune.com/feed/", enabled: true },
  { name: "BD24 Live", sourceCountry: "Bangladesh", sourceOrigin: "Asia-Pacific", sourceType: "Commercial Publisher", url: "https://www.bd24live.com/feed", enabled: true },
  { name: "Jagonews24", sourceCountry: "Bangladesh", sourceOrigin: "Asia-Pacific", sourceType: "Commercial Publisher", url: "https://www.jagonews24.com/rss/rss.xml", enabled: false },

  // ── International ────────────────────────────────────────
  { name: "Al Jazeera", sourceCountry: "Qatar", sourceOrigin: "Middle East", sourceType: "State Media", url: "https://www.aljazeera.com/xml/rss/all.xml", enabled: true },
  { name: "UN News", sourceCountry: "Global", sourceOrigin: "Global", sourceType: "Independent Wire", url: "https://news.un.org/feed/subscribe/en/news/region/global/feed/rss.xml", enabled: true },
  { name: "TechCrunch", sourceCountry: "USA", sourceOrigin: "North America", sourceType: "Commercial Publisher", url: "https://techcrunch.com/feed/", enabled: true },
];

/** Returns only feeds where `enabled` is true across all users or defaults. */
export async function getActiveFeeds() {
  const allFeeds = await getAllFeeds();
  return allFeeds.filter((f) => f.enabled);
}

/** Returns all feeds regardless of enabled status, merged from users and defaults. */
export async function getAllFeeds() {
  let users = [];
  try {
    users = await prisma.user.findMany({ select: { settings: true } });
  } catch (err) {
    console.warn("Could not fetch users for custom feeds:", err.message);
  }

  const feedsMap = new Map();

  // Load defaults
  for (const f of builtinFeeds) {
    feedsMap.set(f.url, { ...f });
  }

  // Load user feeds
  for (const user of users) {
    if (user.settings && Array.isArray(user.settings.customSources)) {
      for (const src of user.settings.customSources) {
        if (!feedsMap.has(src.url)) {
          feedsMap.set(src.url, {
            name: src.name,
            sourceCountry: src.country,
            sourceOrigin: src.sourceOrigin || "Global",
            sourceType: src.sourceType || "Other",
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
