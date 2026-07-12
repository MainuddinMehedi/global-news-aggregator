import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../db/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const feedsPath = path.join(__dirname, "feeds.json");
const builtinFeeds = JSON.parse(fs.readFileSync(feedsPath, "utf8"));

/** Returns only feeds where `enabled` is true across all defaults or DB config. */
export async function getActiveFeeds() {
  const allFeeds = await getAllFeeds();
  return allFeeds.filter((f) => f.enabled);
}

/** Returns all feeds regardless of enabled status from database FeedSource. */
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

  return Array.from(feedsMap.values());
}

export default builtinFeeds;
