import { prisma } from "../db/prisma.js";
import { scanInternalDb } from "./sources/internalDb.js";
import { scanRss } from "./sources/rssScanner.js";
import { scanReddit } from "./sources/redditScanner.js";
import { scanWebpage } from "./sources/webpageScraper.js";
import { scanGithub } from "./sources/githubScanner.js";
import { scanYoutube } from "./sources/youtubeScanner.js";
import { scanBdGovJobs } from "./sources/bdGovJobsScraper.js";
import { scanCompanyCareers } from "./sources/companyCareersScraper.js";
import { scanInternetSearch } from "./sources/internetSearchScanner.js";
import { scoreFindings } from "./scorer.js";
import { processNotifications } from "./notifier.js";
import { generateOverview } from "./overviewGenerator.js";
import { SCANNER_CONFIG, VALID_SOURCE_TYPES } from "./scannerConfig.js";

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

  // 1. Iterate through configured sources
  const metadataUpdates = {};
  const sourceUpdates = [];
  const sourceErrors = []; // Track which sources failed during this scan

  for (const sourceConfig of sources) {
    if (!sourceConfig.enabled) continue;

    if (!VALID_SOURCE_TYPES.has(sourceConfig.type)) {
      console.warn(
        `⚠️ [orchestrator] Unknown source type: ${sourceConfig.type}`,
      );
      continue;
    }

    try {
      let result = { findings: [], metadata: {} };
      switch (sourceConfig.type) {
        case "internal_db":
          result = await scanInternalDb(topic, options);
          break;
        case "google_news":
        case "rss":
          result = await scanRss(topic, sourceConfig, options);
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
        case "search":
          result = await scanInternetSearch(topic, sourceConfig, options);
          break;
        case "scrape":
        case "webpage":
          result = await scanWebpage(topic, sourceConfig, options);
          break;
        default:
          continue;
      }

      const findings = result.findings || [];
      const metadata = result.metadata || {};

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
      sourceErrors.push(sourceConfig.type);
    }
  }

  if (sourceErrors.length > 0) {
    console.warn(`⚠️ [orchestrator] ${sourceErrors.length}/${sources.filter(s => s.enabled).length} sources failed during scan for "${topic.displayName}": [${sourceErrors.join(', ')}]`);
    // TODO(notification): Admin - Any source failure feeds into the Admin Source Health dashboard. Repeated failures across cycles trigger a direct admin alert.
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

  // 5. Filter by Minimum Relevance
  const MIN_RELEVANCE = SCANNER_CONFIG.minRelevance;
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
  if (highQualityFindings.length > 0) {
    try {
      const createPayload = highQualityFindings.map((finding) => ({
        topicId: topic.id,
        sourceType: finding.sourceType,
        sourceName: finding.sourceName,
        sourceUrl: finding.sourceUrl,
        title: finding.title,
        summary: finding.summary,
        rawArticleId: finding.rawArticleId,
        relevanceScore: finding.relevanceScore,
        metadata: finding.metadata || null,
      }));

      const createResult = await prisma.topicFinding.createMany({
        data: createPayload,
        skipDuplicates: true, // Safely ignore duplicate URLs
      });

      insertedCount = createResult.count;
    } catch (err) {
      console.error(`❌ [orchestrator] Bulk insert failed for "${topic.displayName}":`, err.message);
      // TODO(notification): User - Topic shows stale data with no explanation → user-facing "scan partially failed" indicator
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
        `⚠️ [orchestrator] Failed to trigger revalidation for topic ${topic.id}:`,
        e.message,
      );
      // TODO(notification): Admin - Revalidation failure means stale configs or environment issues → direct admin message/alert.
    }
  }

  // 9. Send Notifications
  if (insertedCount > 0) {
    await processNotifications(topic, highQualityFindings);
  }

  console.log(
    `✅ [orchestrator] Inserted ${insertedCount} new findings out of ${allFindings.length} total raw matches.`,
  );

  // 10. Generate AI Findings Overview (if enough findings have accumulated)
  if (insertedCount > 0) {
    try {
      await generateOverview(topic);
    } catch (err) {
      console.error(
        `⚠️ [orchestrator] Overview generation failed:`,
        err.message,
      );
    }
  }

  return insertedCount;
}
