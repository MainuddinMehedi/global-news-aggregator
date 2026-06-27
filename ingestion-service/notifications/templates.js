/**
 * Message formatters for Admin Notifications.
 * Returns { title, message }
 */

export function formatPipelineFailure(payload) {
  const { taskName, errorMessage, metadata } = payload || {};
  return {
    title: `🚨 Pipeline Failure: ${taskName || 'Unknown Task'}`,
    message: `A system task has failed during execution.\n\n**Error:** ${errorMessage || 'No error message provided.'}\n**Metadata:** ${JSON.stringify(metadata || {})}`
  };
}

export function formatIngestionStalled(payload) {
  const { lastSuccessDate, hoursSinceLastSuccess } = payload || {};
  return {
    title: `⚠️ Ingestion Stalled`,
    message: `The RSS ingestion pipeline hasn't completed successfully in the last ${hoursSinceLastSuccess} hours.\n\nLast successful run: ${lastSuccessDate || 'Unknown'}. Check the system logs.`
  };
}

export function formatHighFailureRate(payload) {
  const { taskName, failureCount, timeWindowHours } = payload || {};
  return {
    title: `📈 High Failure Rate: ${taskName}`,
    message: `The task \`${taskName}\` has failed ${failureCount} times in the last ${timeWindowHours} hours. This indicates a persistent issue.`
  };
}

export function formatAiProviderDegraded(payload) {
  const { provider, errorRate, totalCalls, timeWindowHours } = payload || {};
  return {
    title: `🤖 AI Provider Degraded: ${provider}`,
    message: `The AI provider \`${provider}\` is experiencing high failure rates.\n\n**Error Rate:** ${(errorRate * 100).toFixed(1)}%\n**Total Calls:** ${totalCalls}\n**Window:** Last ${timeWindowHours} hours.`
  };
}

export function formatRevalidationFailed(payload) {
  const { tag, error } = payload || {};
  return {
    title: `♻️ Cache Revalidation Failed`,
    message: `Failed to revalidate Next.js cache.\n\n**Tag:** \`${tag}\`\n**Error:** ${error || 'Unknown'}`
  };
}
