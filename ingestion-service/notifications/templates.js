/**
 * Message formatters for Admin Notifications.
 * Returns { title, message }
 */

export function formatPipelineFailure(payload) {
  const { taskName, errorMessage, metadata } = payload || {};
  return {
    title: `🚨 Pipeline Failure: ${taskName || "Unknown Task"}`,
    message: `A system task has failed during execution.\n\n**Error:** ${errorMessage || "No error message provided."}\n**Metadata:** ${JSON.stringify(metadata || {})}`,
  };
}

export function formatIngestionStalled(payload) {
  const { lastSuccessDate, hoursSinceLastSuccess } = payload || {};
  return {
    title: `⚠️ Ingestion Stalled`,
    message: `The RSS ingestion pipeline hasn't completed successfully in the last ${hoursSinceLastSuccess} hours.\n\nLast successful run: ${lastSuccessDate || "Unknown"}. Check the system logs.`,
  };
}

export function formatHighFailureRate(payload) {
  const { taskName, failureCount, timeWindowHours } = payload || {};
  return {
    title: `📈 High Failure Rate: ${taskName}`,
    message: `The task \`${taskName}\` has failed ${failureCount} times in the last ${timeWindowHours} hours. This indicates a persistent issue.`,
  };
}

export function formatAiProviderDegraded(payload) {
  const { provider, errorRate, totalCalls, timeWindowHours } = payload || {};
  return {
    title: `🤖 AI Provider Degraded: ${provider}`,
    message: `The AI provider \`${provider}\` is experiencing high failure rates.\n\n**Error Rate:** ${(errorRate * 100).toFixed(1)}%\n**Total Calls:** ${totalCalls}\n**Window:** Last ${timeWindowHours} hours.`,
  };
}

export function formatRevalidationFailed(payload) {
  const { tag, error } = payload || {};
  return {
    title: `♻️ Cache Revalidation Failed`,
    message: `Failed to revalidate Next.js cache.\n\n**Tag:** \`${tag}\`\n**Error:** ${error || "Unknown"}`,
  };
}

export function formatTopicFindingAlert(payload) {
  const { topicName, findingTitle, sourceName, relevanceScore, sourceUrl } =
    payload || {};
  return {
    title: `🚨 New Finding for Topic: ${topicName || "Topic"}`,
    message: `**Title:** ${findingTitle || "No Title"}\n**Source:** ${sourceName || "Unknown"}\n**Relevance:** ${relevanceScore !== undefined ? (relevanceScore * 100).toFixed(0) + "%" : "N/A"}\n**Link:** ${sourceUrl || "#"}`,
  };
}

export function formatTopicFindingDigest(payload) {
  const { topicName, newFindingsCount, topFindingTitle, topFindingUrl } =
    payload || {};
  return {
    title: `📋 Daily Digest: ${topicName || "Topic"}`,
    message: `You have **${newFindingsCount} new findings** for this topic.\n\n**Top Finding:** ${topFindingTitle || "Unknown"}\n**Link:** ${topFindingUrl || "#"}`,
  };
}

export function formatSystemNewsDigest(payload) {
  const { newStoriesCount, topStoryTitle, topStorySummary, storySlug } =
    payload || {};
  // Assuming a generic domain for the link; update if domain is different
  const storyUrl = storySlug
    ? `https://globalnews.example.com/story/${storySlug}`
    : "#";
  return {
    title: `🌍 Global News Daily Digest`,
    message: `We tracked **${newStoriesCount} major stories** in the last 24 hours.\n\n**Top Story:** ${topStoryTitle || "Unknown"}\n${topStorySummary ? `*${topStorySummary}*\n` : ""}**Link:** ${storyUrl}`,
  };
}

export function formatTopicSourceDegraded(payload) {
  const { topicName, sourceName, failureCount, error } = payload || {};
  const failText =
    failureCount !== undefined
      ? `${failureCount} consecutive scans`
      : "its scans";
  const errorText = error ? `\n\n**Error Details:** ${error}` : "";
  return {
    title: `⚠️ Topic Source Degraded: ${topicName || "Topic"}`,
    message: `The source \`${sourceName || "Unknown"}\` for topic \`${topicName || "Topic"}\` has failed ${failText}. Please verify its credentials or availability.${errorText}`,
  };
}

export function formatTopicScanDegraded(payload) {
  const { topicName, error } = payload || {};
  return {
    title: `⚠️ Topic Scan Stalled: ${topicName || "Topic"}`,
    message: `Your monitored topic \`${topicName || "Topic"}\` failed to scan properly due to system errors or unreachable sources. ${error ? `\n\n**Error:** ${error}` : ""}`,
  };
}

export function formatNewSourceAdded(payload) {
  const { sourceName, sourceUrl } = payload || {};
  return {
    title: `📡 New Feed Source: ${sourceName || "Unknown"}`,
    message: `A new news feed source \`${sourceName || "Unknown"}\` (${sourceUrl || ""}) has been added to the system.`,
  };
}
