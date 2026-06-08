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
  const metadataUpdates = {};
  const sourceUpdates = [];

  for (const sourceConfig of sources) {
    if (!sourceConfig.enabled) continue;

    try {
      let result;
      switch (sourceConfig.type) {
        case "google_news":
        case "rss":
          result = await scanRss(topic, sourceConfig, options);
          break;
        case "brave":
          result = await scanBrave(topic, sourceConfig, options);
          break;
        case "reddit":
          result = await scanReddit(topic, sourceConfig, options);
          break;
        case "github":
          result = await scanGithub(topic, sourceConfig, options);
          break;
        case "youtube":
          result = await scanYoutube(topic, sourceConfig, options);
          break;
        case "bd_gov_jobs":
          result = await scanBdGovJobs(topic, sourceConfig, options);
          break;
        case "company_careers":
          result = await scanCompanyCareers(topic, sourceConfig, options);
          break;
        case "internal_db":
          // Handled above
          continue;
        case "scrape":
        case "webpage":
          result = await scanWebpage(topic, sourceConfig, options);
          break;
        default:
          console.warn(
            `⚠️ [orchestrator] Unknown source type: ${sourceConfig.type}`,
          );
          continue;
      }

      // Handle both Array and { findings, metadata } return shapes
      const findings = Array.isArray(result) ? result : result.findings || [];
      const metadata = !Array.isArray(result) ? result.metadata || {} : {};

      allFindings.push(...findings);

      // Collect metadata for batch update at the end
      if (metadata.liveWebSummary) {
        metadataUpdates.liveWebSummary = metadata.liveWebSummary;
      }
      if (metadata.newHash) {
        sourceUpdates.push({ url: metadata.url, newHash: metadata.newHash });
      }
    } catch (err) {
      console.error(
        `❌ [orchestrator] Scanner ${sourceConfig.type} failed:`,
        err.message,
      );
    }
  }

  // Apply metadata updates (summaries, hashes) to the topic record
  if (Object.keys(metadataUpdates).length > 0 || sourceUpdates.length > 0) {
    const data = { ...metadataUpdates };

    if (sourceUpdates.length > 0) {
      const updatedSources = sources.map((s) => {
        const update = sourceUpdates.find(
          (u) => u.url === s.url && s.type === "webpage",
        );
        return update ? { ...s, lastSeenHash: update.newHash } : s;
      });
      data.sources = updatedSources;
    }

    await prisma.lockedTopic.update({
      where: { id: topic.id },
      data,
    });
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
  let duplicatesInRun = 0;
  for (const finding of allFindings) {
    if (finding.sourceUrl) {
      if (uniqueFindingsMap.has(finding.sourceUrl)) {
        duplicatesInRun++;
      } else {
        uniqueFindingsMap.set(finding.sourceUrl, finding);
      }
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

  const newFindings = uniqueFindings.filter((f) => {
    if (existingUrls.has(f.sourceUrl)) {
      return false;
    }
    return true;
  });

  const duplicatesInDb = uniqueFindings.length - newFindings.length;

  if (newFindings.length === 0) {
    console.log(
      `   ⚪ [orchestrator] All ${allFindings.length} findings were duplicates (${duplicatesInRun} in run, ${duplicatesInDb} in DB).`,
    );
    await prisma.lockedTopic.update({
      where: { id: topic.id },
      data: { lastScannedAt: new Date() },
    });
    return 0;
  }

  if (duplicatesInRun > 0 || duplicatesInDb > 0) {
    console.log(
      `   📊 [orchestrator] Deduped: ${duplicatesInRun} from current run, ${duplicatesInDb} already in database.`,
    );
  }

  // 4. Relevance Scoring
  const scoredFindings = await scoreFindings(topic, newFindings);

  // 5. Filter by Minimum Relevance (e.g., 0.5)
  const MIN_RELEVANCE = 0.5;
  const highQualityFindings = scoredFindings.filter(
    (f) => f.relevanceScore === null || f.relevanceScore >= MIN_RELEVANCE,
  );

  const discardedCount = scoredFindings.length - highQualityFindings.length;
  if (discardedCount > 0) {
    console.log(
      `   🗑️ [orchestrator] Discarded ${discardedCount} findings due to low relevance score (< ${MIN_RELEVANCE}).`,
    );
  }

  // 6. Bulk Insert
  let insertedCount = 0;
  for (const finding of highQualityFindings) {
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

  // 7. Update Topic Metadata
  const updateData = { lastScannedAt: new Date() };
  if (insertedCount > 0) {
    updateData.matchCount = { increment: insertedCount };
    updateData.lastMatchedAt = new Date();
  }

  await prisma.lockedTopic.update({
    where: { id: topic.id },
    data: updateData,
  });

  // 8. Trigger Revalidation
  if (insertedCount > 0) {
    try {
      const revalidateUrl = `${process.env.NEXT_PUBLIC_API_URL}/revalidate?tag=topic-findings-${topic.id}&secret=${process.env.REVALIDATE_SECRET}`;
      await fetch(revalidateUrl);
      console.log(
        `🔄 [orchestrator] Triggered revalidation for topic: ${topic.id}`,
      );
    } catch (e) {
      console.error(
        `⚠️ [orchestrator] Failed to trigger revalidation:`,
        e.message,
      );
    }
  }

  // 9. Send Notifications
  if (insertedCount > 0) {
    await processNotifications(topic, highQualityFindings);
  }

  console.log(
    `✅ [orchestrator] Inserted ${insertedCount} new findings out of ${allFindings.length} total raw matches.`,
  );
  return insertedCount;
}
