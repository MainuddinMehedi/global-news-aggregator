import { prisma } from "../db/prisma.js";
import { scanInternalDb } from "./sources/internalDb.js";
import { scanRss } from "./sources/rssScanner.js";
import { scanBrave } from "./sources/braveScanner.js";
import { scanReddit } from "./sources/redditScanner.js";
import { scanWebpage } from "./sources/webpageScraper.js";
import { scanGithub } from "./sources/githubScanner.js";
import { scanYoutube } from "./sources/youtubeScanner.js";
import { scanBdGovJobs } from "./sources/bdGovJobsScraper.js";
import { scanCompanyCareers } from "./sources/companyCareersScraper.js";
import { scoreFindings } from "./scorer.js";
import { processNotifications } from "./notifier.js";

/**
 * Master orchestrator for Locked Topic scanning.
 *
 * It iterates through a topic's configured sources and delegates scanning to
 * the appropriate scanner module. Finally, it aggregates findings, deduplicates,
 * and saves them to the database.
 *
 * @param {object} topic - The LockedTopic record
 * @param {object} options
 * @param {boolean} options.fullScan - If true, skips incremental date filtering
 * @returns {number} The number of new findings inserted
 */
export async function runScannersForTopic(topic, options = {}) {
  console.log(
    `\n🚀 [orchestrator] Starting scan for topic: "${topic.displayName}"`,
  );

  let allFindings = [];

  const sources = Array.isArray(topic.sources)
    ? topic.sources
    : topic.sources
      ? JSON.parse(topic.sources)
      : [];

  // 1. Internal DB Scan (Always run if searchBeyondSources is true or internal_db is in sources)
  const hasInternalDbConfig = sources.some(
    (s) => s.type === "internal_db" && s.enabled,
  );
  if (topic.searchBeyondSources || hasInternalDbConfig) {
    const internalFindings = await scanInternalDb(topic, options);
    allFindings.push(...internalFindings);
  }

  // 2. Iterate through configured external sources
  for (const sourceConfig of sources) {
    if (!sourceConfig.enabled) continue;

    try {
      switch (sourceConfig.type) {
        case "google_news":
        case "rss":
          const rssFindings = await scanRss(topic, sourceConfig, options);
          allFindings.push(...rssFindings);
          break;
        case "brave":
          const braveFindings = await scanBrave(topic, sourceConfig, options);
          allFindings.push(...braveFindings);
          break;
        case "reddit":
          const redditFindings = await scanReddit(topic, sourceConfig, options);
          allFindings.push(...redditFindings);
          break;
        case "github":
          const githubFindings = await scanGithub(topic, sourceConfig, options);
          allFindings.push(...githubFindings);
          break;
        case "youtube":
          const youtubeFindings = await scanYoutube(
            topic,
            sourceConfig,
            options,
          );
          allFindings.push(...youtubeFindings);
          break;
        case "bd_gov_jobs":
          const bdGovJobsFindings = await scanBdGovJobs(
            topic,
            sourceConfig,
            options,
          );
          allFindings.push(...bdGovJobsFindings);
          break;
        case "company_careers":
          const companyCareersFindings = await scanCompanyCareers(
            topic,
            sourceConfig,
            options,
          );
          allFindings.push(...companyCareersFindings);
          break;
        case "internal_db":
          // Handled above to ensure it runs even if only searchBeyondSources is enabled
          break;
        case "scrape":
        case "webpage":
          const webpageFindings = await scanWebpage(
            topic,
            sourceConfig,
            options,
          );
          allFindings.push(...webpageFindings);
          break;
        default:
          console.warn(
            `⚠️ [orchestrator] Unknown source type: ${sourceConfig.type}`,
          );
      }
    } catch (err) {
      console.error(
        `❌ [orchestrator] Scanner ${sourceConfig.type} failed:`,
        err.message,
      );
    }
  }

  if (allFindings.length === 0) {
    console.log(`   ⚪ [orchestrator] No new findings across all scanners.`);
    await prisma.lockedTopic.update({
      where: { id: topic.id },
      data: { lastScannedAt: new Date() },
    });
    return 0;
  }

  // 3. Deduplication (URL-based within this run and against DB)
  // Dedupe within current findings array
  const uniqueFindingsMap = new Map();
  for (const finding of allFindings) {
    if (finding.sourceUrl && !uniqueFindingsMap.has(finding.sourceUrl)) {
      uniqueFindingsMap.set(finding.sourceUrl, finding);
    }
  }
  const uniqueFindings = Array.from(uniqueFindingsMap.values());

  // Dedupe against database
  const existingUrls = new Set(
    (
      await prisma.topicFinding.findMany({
        where: { topicId: topic.id },
        select: { sourceUrl: true },
      })
    ).map((f) => f.sourceUrl),
  );

  const newFindings = uniqueFindings.filter(
    (f) => !existingUrls.has(f.sourceUrl),
  );

  if (newFindings.length === 0) {
    console.log(
      `   ⚪ [orchestrator] All findings were duplicates. Nothing new.`,
    );
    await prisma.lockedTopic.update({
      where: { id: topic.id },
      data: { lastScannedAt: new Date() },
    });
    return 0;
  }

  // 4. Relevance Scoring
  const scoredFindings = await scoreFindings(topic, newFindings);

  // 5. Bulk Insert
  let insertedCount = 0;
  for (const finding of scoredFindings) {
    try {
      await prisma.topicFinding.create({
        data: {
          topicId: topic.id,
          sourceType: finding.sourceType,
          sourceName: finding.sourceName,
          sourceUrl: finding.sourceUrl,
          title: finding.title,
          summary: finding.summary,
          rawArticleId: finding.rawArticleId,
          relevanceScore: finding.relevanceScore,
          metadata: finding.metadata || null,
        },
      });
      insertedCount++;
    } catch (err) {
      // Ignore unique constraint race conditions
    }
  }

  // 6. Update Topic Metadata
  const updateData = { lastScannedAt: new Date() };
  if (insertedCount > 0) {
    updateData.matchCount = { increment: insertedCount };
    updateData.lastMatchedAt = new Date();
  }

  await prisma.lockedTopic.update({
    where: { id: topic.id },
    data: updateData,
  });

  // 7. Send Notifications
  if (insertedCount > 0) {
    await processNotifications(topic, scoredFindings);
  }

  console.log(
    `✅ [orchestrator] Inserted ${insertedCount} new findings out of ${allFindings.length} total raw matches.`,
  );
  return insertedCount;
}
