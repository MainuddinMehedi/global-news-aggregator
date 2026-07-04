import { prisma } from "../db/prisma.js";
import { emitNotification } from "./emitter.js";
import { calculateDigestWindow } from "./timeUtils.js";

/**
 * Worker that runs periodically (hourly) to send digests for Locked Topics.
 */
export async function processNotificationDigests() {
  console.log(`[Topics Digest Worker] Starting digest generation...`);

  // 1. Fetch all active topics that have digest mode enabled, including user preferences
  const topics = await prisma.lockedTopic.findMany({
    where: {
      isActive: true,
      notifyEnabled: true,
      notifyMode: "DIGEST",
    },
    include: {
      user: {
        include: {
          notificationPreference: true,
        },
      },
    },
  });

  if (topics.length === 0) {
    console.log(`[Topics Digest Worker] No topics configured for digests.`);
    return;
  }

  let digestsSent = 0;

  for (const topic of topics) {
    if (!topic.userId || !topic.user?.notificationPreference) continue;

    const pref = topic.user.notificationPreference;

    // Determine the last time a digest was sent for this specific topic
    // We check the notification history for this topic's digest payload
    const lastNotif = await prisma.notification.findFirst({
      where: {
        userId: topic.userId,
        type: "TOPIC_FINDING_DIGEST",
        payload: {
          path: ["topicId"],
          equals: topic.id,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const lastDigestAt = lastNotif ? lastNotif.createdAt : null;
    const window = calculateDigestWindow(pref.digestFrequency, lastDigestAt);

    if (!window.isDue) {
      continue; // Not time for a digest yet based on the user's frequency
    }

    // 2. Fetch unread findings from the calculated cutoff date
    const recentFindings = await prisma.topicFinding.findMany({
      where: {
        topicId: topic.id,
        isRead: false,
        foundAt: {
          gte: window.cutoffDate,
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
        `[Topics Digest Worker] Failed to parse notifyChannels for topic ${topic.id}`,
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
        `[Topics Digest Worker] Failed to emit digest for topic ${topic.id}:`,
        err.message,
      );
    }
  }

  console.log(
    `[Topics Digest Worker] Finished. Sent ${digestsSent} digest notifications.`,
  );
}
