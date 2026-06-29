/**
 * Company Careers Scraper — Brute-force ATS monitoring.
 *
 * Takes a company name/slug and checks major ATS platforms (Greenhouse, Lever)
 * to see if a public job board exists. If found, extracts jobs matching the topic.
 */

import { emitNotification } from "../../notifications/emitter.js";

const USER_AGENT = 'global-news-aggregator/1.0 (LockedTopics ATS Monitor)';

/**
 * Checks Greenhouse API for jobs.
 */
async function checkGreenhouse(companySlug, topic, lastScan) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${companySlug}/jobs`;
  const findings = [];

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) return findings; // 404 means they don't use Greenhouse, just skip.

    const data = await response.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return findings;

    const queryTerms = (topic.aiRefinedQuery || topic.displayName)
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 2);

    for (const job of data.jobs) {
      const pubDate = new Date(job.updated_at);
      if (pubDate <= lastScan) continue;

      const contentForMatching = (job.title + " " + (job.location?.name || "")).toLowerCase();
      const isMatch = queryTerms.length === 0 || queryTerms.every(term => contentForMatching.includes(term));

      if (isMatch) {
        findings.push({
          title: `[Job] ${job.title}`,
          sourceUrl: job.absolute_url,
          sourceName: `${data.name || companySlug} (Greenhouse)`,
          summary: `Location: ${job.location?.name || 'Remote/Unspecified'}`,
          rawArticleId: null,
          sourceType: 'COMPANY_CAREERS'
        });
      }
    }
  } catch (err) {
    console.warn(`⚠️ [companyCareersScraper] Greenhouse check failed for "${companySlug}":`, err.message);
    if (topic.userId) {
      await emitNotification({
        userId: topic.userId,
        type: "TOPIC_SOURCE_DEGRADED",
        payload: {
          topicName: topic.displayName,
          sourceName: `${companySlug} (Greenhouse)`,
          error: err.message
        }
      });
    }
  }
  return findings;
}

/**
 * Checks Lever API for jobs.
 */
async function checkLever(companySlug, topic, lastScan) {
  const url = `https://api.lever.co/v0/postings/${companySlug}?mode=json`;
  const findings = [];

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) return findings; // 404 means they don't use Lever, just skip.

    const data = await response.json();
    if (!Array.isArray(data)) return findings;

    const queryTerms = (topic.aiRefinedQuery || topic.displayName)
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 2);

    for (const job of data) {
      const pubDate = new Date(job.createdAt);
      if (pubDate <= lastScan) continue;

      const contentForMatching = (
        job.text + " " +
        (job.categories?.location || "") + " " +
        (job.categories?.team || "")
      ).toLowerCase();

      const isMatch = queryTerms.length === 0 || queryTerms.every(term => contentForMatching.includes(term));

      if (isMatch) {
        findings.push({
          title: `[Job] ${job.text}`,
          sourceUrl: job.hostedUrl,
          sourceName: `${companySlug} (Lever)`,
          summary: `Location: ${job.categories?.location || 'Remote/Unspecified'} | Team: ${job.categories?.team || 'General'}`,
          rawArticleId: null,
          sourceType: 'COMPANY_CAREERS'
        });
      }
    }
  } catch (err) {
    console.warn(`⚠️ [companyCareersScraper] Lever check failed for "${companySlug}":`, err.message);
    if (topic.userId) {
      await emitNotification({
        userId: topic.userId,
        type: "TOPIC_SOURCE_DEGRADED",
        payload: {
          topicName: topic.displayName,
          sourceName: `${companySlug} (Lever)`,
          error: err.message
        }
      });
    }
  }
  return findings;
}

/**
 * Scans for company careers across known ATS providers.
 *
 * @param {object} topic - The LockedTopic record
 * @param {object} sourceConfig - { type: 'company_careers', company_name, label }
 * @param {object} options
 * @returns {Array<object>} Normalized findings
 */
export async function scanCompanyCareers(topic, sourceConfig, options = {}) {
  // If company_name isn't directly provided, try to use the label, or fallback to the topic name
  let rawName = sourceConfig.company_name || sourceConfig.label || topic.displayName;

  // Clean it up to create a likely ATS slug (e.g., "Stripe Inc." -> "stripe")
  const slug = rawName.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

  if (!slug) return { findings: [], metadata: {} };

  console.log(`🔍 [companyCareersScraper] Brute-force checking ATS platforms for "${slug}"...`);

  const lastScan = topic.lastScannedAt ? new Date(topic.lastScannedAt) : new Date(0);

  // Run checks in parallel
  const [greenhouseFindings, leverFindings] = await Promise.all([
    checkGreenhouse(slug, topic, lastScan),
    checkLever(slug, topic, lastScan)
  ]);

  const allFindings = [...greenhouseFindings, ...leverFindings];

  console.log(`   📊 [companyCareersScraper] Found ${allFindings.length} matching jobs for "${slug}".`);
  return { findings: allFindings, metadata: {} };
}
