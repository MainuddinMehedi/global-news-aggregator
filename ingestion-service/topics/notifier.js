/**
 * Notifier — Sends alerts for high-relevance findings to Discord/Telegram.
 */

import fetch from 'node-fetch';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Send a notification to Discord
 */
async function sendDiscord(topic, finding) {
  if (!DISCORD_WEBHOOK_URL) return;

  const content = `🚨 **New Finding for Topic: ${topic.displayName}** 🚨\n\n**Title:** ${finding.title}\n**Source:** ${finding.sourceName}\n**Relevance:** ${finding.relevanceScore}\n**Link:** ${finding.sourceUrl}`;

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
  } catch (err) {
    console.error("⚠️ [notifier] Discord delivery failed:", err.message);
  }
}

/**
 * Send a notification to Telegram
 */
async function sendTelegram(topic, finding) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  const text = `🚨 *New Finding for Topic: ${topic.displayName}* 🚨\n\n*Title:* ${finding.title}\n*Source:* ${finding.sourceName}\n*Relevance:* ${finding.relevanceScore}\n[Read More](${finding.sourceUrl})`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: "Markdown"
      })
    });
  } catch (err) {
    console.error("⚠️ [notifier] Telegram delivery failed:", err.message);
  }
}

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
  const highRelevanceFindings = findings.filter(f => f.relevanceScore >= threshold);

  if (highRelevanceFindings.length === 0) return;

  console.log(`🔔 [notifier] Sending ${highRelevanceFindings.length} notifications for topic: "${topic.displayName}"...`);

  // Extract notifyChannels configuration
  let channels = { discord: false, telegram: false };
  try {
    if (typeof topic.notifyChannels === 'string') {
      channels = JSON.parse(topic.notifyChannels);
    } else if (typeof topic.notifyChannels === 'object') {
      channels = topic.notifyChannels;
    }
  } catch (e) {
    // defaults
  }

  for (const finding of highRelevanceFindings) {
    const promises = [];
    if (channels.discord) promises.push(sendDiscord(topic, finding));
    if (channels.telegram) promises.push(sendTelegram(topic, finding));

    await Promise.allSettled(promises);
  }
}
