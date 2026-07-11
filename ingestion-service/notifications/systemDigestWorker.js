import { prisma } from "../db/prisma.js";
import { emitNotification } from "./emitter.js";
import { calculateDigestWindow } from "./timeUtils.js";

/**
 * Worker that runs periodically (hourly) to send system-wide news digests.
 * It queries users with digestEnabled = true and sends the top new StoryClusters based on their timeframe.
 */
export async function processSystemNewsDigests() {
  console.log(
    `[System Digest Worker] Starting system-wide news digest generation...`,
  );

  // 1. Fetch all users that have global digests enabled
  const preferences = await prisma.notificationPreference.findMany({
    where: {
      digestEnabled: true,
    },
    include: {
      user: true,
    },
  });

  if (preferences.length === 0) {
    console.log(
      `[System Digest Worker] No users configured for system digests.`,
    );
    return;
  }

  let digestsSent = 0;

  for (const pref of preferences) {
    if (!pref.userId) continue;

    const window = calculateDigestWindow(
      pref.digestFrequency,
      pref.lastDigestAt,
    );

    if (!window.isDue) {
      continue; // Not time for a digest yet based on user's frequency
    }

    // 2. Fetch top new StoryClusters specifically for this user's time window
    const topClusters = await prisma.storyCluster.findMany({
      where: {
        isActive: true,
        createdAt: {
          gte: window.cutoffDate,
        },
      },
      orderBy: {
        impactScore: "desc",
      },
      take: 5, // Top 5 stories
    });

    if (topClusters.length === 0) {
      continue; // No major news for this user in their timeframe
    }

    // 3. Extract channels based on global preference
    const resolvedChannels = ["IN_APP"];
    if (pref.discordEnabled && pref.discordWebhook)
      resolvedChannels.push("DISCORD");
    if (pref.telegramEnabled && pref.telegramChatId)
      resolvedChannels.push("TELEGRAM");

    // 4. Emit the digest notification
    const topCluster = topClusters[0];

    try {
      await emitNotification({
        userId: pref.userId,
        type: "SYSTEM_NEWS_DIGEST",
        priority: "NORMAL",
        payload: {
          newStoriesCount: topClusters.length,
          topStoryTitle: topCluster.title,
          topStorySummary: topCluster.summary,
          storySlug: topCluster.slug,
        },
        channels: resolvedChannels,
      });
      digestsSent++;

      // Update last digest time
      await prisma.notificationPreference.update({
        where: { id: pref.id },
        data: { lastDigestAt: new Date() },
      });
    } catch (err) {
      console.error(
        `[System Digest Worker] Failed to emit digest for user ${pref.userId}:`,
        err.message,
      );
    }
  }

  console.log(
    `[System Digest Worker] Finished. Sent ${digestsSent} system digest notifications.`,
  );
}
