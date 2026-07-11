/**
 * Notifier — Integrates Locked Topic scanner findings with the new Notification Engine.
 */

import { emitNotification } from "../notifications/emitter.js";

/**
 * Processes a list of new findings and sends notifications based on topic settings.
 *
 * @param {object} topic
 * @param {Array<object>} findings
 */
export async function processNotifications(topic, findings) {
  if (!topic.notifyEnabled) return;
  if (findings.length === 0) return;

  // Filter for high relevance findings based on topic's threshold
  const threshold = topic.notifyThreshold || 0.8;
  const highRelevanceFindings = findings.filter(
    (f) => f.relevanceScore >= threshold,
  );

  if (highRelevanceFindings.length === 0) return;

  console.log(
    `🔔 [notifier] Processing ${highRelevanceFindings.length} notifications for topic: "${topic.displayName}" via Notification Engine...`,
  );

  // Extract notifyChannels configuration
  let channelsConfig = { discord: false, telegram: false };
  try {
    if (typeof topic.notifyChannels === "string") {
      channelsConfig = JSON.parse(topic.notifyChannels);
    } else if (typeof topic.notifyChannels === "object" && topic.notifyChannels !== null) {
      channelsConfig = topic.notifyChannels;
    }
  } catch (e) {
    console.warn(`⚠️ [notifier] Failed to parse notifyChannels for topic "${topic.displayName}" (raw: ${topic.notifyChannels}). Defaulting to in-app only.`);
  }

  // Build channels array: In-app is always enabled for alerts, others are opt-in
  const resolvedChannels = ["IN_APP"];
  if (channelsConfig.discord) resolvedChannels.push("DISCORD");
  if (channelsConfig.telegram) resolvedChannels.push("TELEGRAM");

  for (const finding of highRelevanceFindings) {
    if (!topic.userId) {
      console.warn(`⚠️ [notifier] Missing userId for topic "${topic.displayName}". Skipping notification emit.`);
      continue;
    }

    if (topic.notifyMode === "DIGEST") {
      // Skip emitting immediate alerts. The digest worker will pick up unread findings later.
      continue;
    }

    try {
      await emitNotification({
        userId: topic.userId,
        type: "TOPIC_FINDING_ALERT",
        priority: "NORMAL",
        payload: {
          topicName: topic.displayName,
          findingTitle: finding.title,
          sourceName: finding.sourceName,
          relevanceScore: finding.relevanceScore,
          sourceUrl: finding.sourceUrl,
          topicId: topic.id,
          findingId: finding.id,
        },
        channels: resolvedChannels,
      });
    } catch (err) {
      console.error(`⚠️ [notifier] Failed to emit finding notification:`, err.message);
    }
  }
}
