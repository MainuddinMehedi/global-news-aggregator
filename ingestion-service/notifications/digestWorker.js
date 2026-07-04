import { prisma } from "../db/prisma.js";
import { emitNotification } from "./emitter.js";

/**
 * Worker that runs periodically (e.g. daily) to send digests for Locked Topics.
 */
export async function processNotificationDigests() {
  console.log(`[Digest Worker] Starting daily digest generation...`);

  // 1. Fetch all active topics that have digest mode enabled
  const topics = await prisma.lockedTopic.findMany({
    where: {
      isActive: true,
      notifyEnabled: true,
      notifyMode: "DIGEST",
    },
  });

  if (topics.length === 0) {
    console.log(`[Digest Worker] No topics configured for digests.`);
    return;
  }

  // 24 hours ago
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let digestsSent = 0;

  for (const topic of topics) {
    if (!topic.userId) continue;

    // 2. Fetch unread findings from the last 24 hours for this topic
    const recentFindings = await prisma.topicFinding.findMany({
      where: {
        topicId: topic.id,
        isRead: false,
        foundAt: {
          gte: oneDayAgo,
        },
      },
      orderBy: {
        relevanceScore: "desc", // highest relevance first
      },
    });

    if (recentFindings.length === 0) {
      continue;
    }

    // 3. Extract channels
    let channelsConfig = { discord: false, telegram: false };
    try {
      if (typeof topic.notifyChannels === "string") {
        channelsConfig = JSON.parse(topic.notifyChannels);
      } else if (
        typeof topic.notifyChannels === "object" &&
        topic.notifyChannels !== null
      ) {
        channelsConfig = topic.notifyChannels;
      }
    } catch (e) {
      console.warn(
        `[Digest Worker] Failed to parse notifyChannels for topic ${topic.id}`,
      );
    }

    const resolvedChannels = ["IN_APP"];
    if (channelsConfig.discord) resolvedChannels.push("DISCORD");
    if (channelsConfig.telegram) resolvedChannels.push("TELEGRAM");

    // 4. Emit the digest notification
    const topFinding = recentFindings[0];

    try {
      await emitNotification({
        userId: topic.userId,
        type: "TOPIC_FINDING_DIGEST",
        priority: "NORMAL",
        payload: {
          topicName: topic.displayName,
          newFindingsCount: recentFindings.length,
          topFindingTitle: topFinding.title,
          topFindingUrl: topFinding.sourceUrl,
          topicId: topic.id,
        },
        channels: resolvedChannels,
      });
      digestsSent++;
    } catch (err) {
      console.error(
        `[Digest Worker] Failed to emit digest for topic ${topic.id}:`,
        err.message,
      );
    }
  }

  console.log(
    `[Digest Worker] Finished. Sent ${digestsSent} digest notifications.`,
  );
}
