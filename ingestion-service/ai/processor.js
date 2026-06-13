import { prisma } from "../db/prisma.js";
import { ALLOWED_CATEGORIES } from "./categories.js";
import { processClusteringBatchWithAI } from "./client.js";
import { enrichWithStage1 } from "./stage1.js";
import { enrichWithStage2Batch } from "./stage2.js";

const ALLOWED_IMPACTS = new Set(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
const ALLOWED_STATUSES = new Set([
  "ESCALATING",
  "DEVELOPING",
  "STABLE",
  "RESOLVING",
]);
const CLUSTER_ASSIGNMENT_MIN_CONFIDENCE = Number.parseFloat(
  process.env.CLUSTER_ASSIGNMENT_MIN_CONFIDENCE || "0.55",
);
const DAY_MS = 24 * 60 * 60 * 1000;
const CLUSTER_STABLE_INACTIVE_DAYS = Number.parseInt(
  process.env.CLUSTER_STABLE_INACTIVE_DAYS || "7",
  10,
);
const CLUSTER_LOW_IMPACT_INACTIVE_DAYS = Number.parseInt(
  process.env.CLUSTER_LOW_IMPACT_INACTIVE_DAYS || "10",
  10,
);
const CLUSTER_MEDIUM_IMPACT_INACTIVE_DAYS = Number.parseInt(
  process.env.CLUSTER_MEDIUM_IMPACT_INACTIVE_DAYS || "21",
  10,
);
const CLUSTER_HIGH_IMPACT_INACTIVE_DAYS = Number.parseInt(
  process.env.CLUSTER_HIGH_IMPACT_INACTIVE_DAYS || "35",
  10,
);
const CLUSTER_CRITICAL_IMPACT_INACTIVE_DAYS = Number.parseInt(
  process.env.CLUSTER_CRITICAL_IMPACT_INACTIVE_DAYS || "60",
  10,
);
const CATEGORY_ALIASES = {
  agriculture: "economy",
  conflict: "security",
  crime: "security",
  culture: "society",
  disaster: "environment",
  education: "society",
  energy: "economy",
  entertainment: "society",
  "human rights": "society",
  infrastructure: "economy",
  justice: "security",
  lifestyle: "society",
  migration: "society",
  religion: "society",
  sports: "other",
  transportation: "society",
};

export function cleanString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeArticleCategory(category) {
  const normalized = cleanString(category)?.toLowerCase();
  if (!normalized) return null;

  return CATEGORY_ALIASES[normalized] || normalized;
}

export function cleanNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function cleanStringArray(value, limit = 12) {
  if (!Array.isArray(value)) return undefined;

  const cleaned = [
    ...new Set(
      value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];

  return cleaned.slice(0, limit);
}

function cleanKeyDevelopments(value, limit = 10) {
  if (!Array.isArray(value)) return undefined;

  const cleaned = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const title = cleanString(item.title);
      if (!title) return null;

      const development = { title };
      const date = cleanString(item.date);
      const description = cleanString(item.description);

      if (date) development.date = date;
      if (description) development.description = description;

      return development;
    })
    .filter(Boolean);

  return cleaned.slice(0, limit);
}

function mergeStringArrays(existing, incoming, limit = 12) {
  return [
    ...new Set([...(existing || []), ...(incoming || [])].filter(Boolean)),
  ].slice(0, limit);
}

function mergeKeyDevelopments(existing, incoming, limit = 10) {
  const merged = [];
  const seen = new Set();

  for (const development of [
    ...(cleanKeyDevelopments(existing, limit) || []),
    ...(incoming || []),
  ]) {
    const key = `${development.title}|${development.date || ""}`.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    merged.push(development);
  }

  return merged.slice(-limit);
}

export function buildClusterUpdateData(clusterUpdate, existingCluster) {
  const data = {};

  const title = cleanString(clusterUpdate.title);
  const summary = cleanString(clusterUpdate.summary);
  const timeWindow = cleanString(clusterUpdate.timeWindow);
  const impact = cleanString(clusterUpdate.impact);
  const status = cleanString(clusterUpdate.status);
  const whyItMatters = cleanString(clusterUpdate.whyItMatters);
  const regions = cleanStringArray(clusterUpdate.regions);
  const themes = cleanStringArray(clusterUpdate.themes);
  const keyDevelopments = cleanKeyDevelopments(clusterUpdate.keyDevelopments);

  if (title) data.title = title;
  if (summary) data.summary = summary;
  if (timeWindow) data.timeWindow = timeWindow;
  if (impact && ALLOWED_IMPACTS.has(impact)) data.impact = impact;
  if (status && ALLOWED_STATUSES.has(status)) data.status = status;
  if (whyItMatters) data.whyItMatters = whyItMatters;
  if (regions) {
    data.regions = mergeStringArrays(existingCluster?.regions, regions);
  }
  if (themes) {
    data.themes = mergeStringArrays(existingCluster?.themes, themes);
  }
  if (keyDevelopments) {
    data.keyDevelopments = mergeKeyDevelopments(
      existingCluster?.keyDevelopments,
      keyDevelopments,
    );
  }

  return data;
}

function daysAgo(days) {
  return new Date(Date.now() - days * DAY_MS);
}

function inactiveByActivityCutoff(cutoff) {
  return {
    OR: [
      { lastActivityAt: { lt: cutoff } },
      { lastActivityAt: null, updatedAt: { lt: cutoff } },
    ],
  };
}

export async function applyClusterLifecycle() {
  const stableCutoff = daysAgo(CLUSTER_STABLE_INACTIVE_DAYS);
  const lowImpactCutoff = daysAgo(CLUSTER_LOW_IMPACT_INACTIVE_DAYS);
  const mediumImpactCutoff = daysAgo(CLUSTER_MEDIUM_IMPACT_INACTIVE_DAYS);
  const highImpactCutoff = daysAgo(CLUSTER_HIGH_IMPACT_INACTIVE_DAYS);
  const criticalImpactCutoff = daysAgo(CLUSTER_CRITICAL_IMPACT_INACTIVE_DAYS);

  const [stableResult, lowResult, mediumResult, highResult, criticalResult] =
    await Promise.all([
      // STABLE or RESOLVING — deactivate after 7 days regardless of impact
      prisma.storyCluster.updateMany({
        where: {
          isActive: true,
          status: { in: ["STABLE", "RESOLVING"] },
          AND: [inactiveByActivityCutoff(stableCutoff)],
        },
        data: { isActive: false },
      }),
      // LOW impact
      prisma.storyCluster.updateMany({
        where: {
          isActive: true,
          impact: "LOW",
          status: { notIn: ["STABLE", "RESOLVING"] },
          AND: [inactiveByActivityCutoff(lowImpactCutoff)],
        },
        data: { isActive: false },
      }),
      // MEDIUM impact
      prisma.storyCluster.updateMany({
        where: {
          isActive: true,
          impact: "MEDIUM",
          status: { notIn: ["STABLE", "RESOLVING"] },
          AND: [inactiveByActivityCutoff(mediumImpactCutoff)],
        },
        data: { isActive: false },
      }),
      // HIGH impact
      prisma.storyCluster.updateMany({
        where: {
          isActive: true,
          impact: "HIGH",
          status: { notIn: ["STABLE", "RESOLVING"] },
          AND: [inactiveByActivityCutoff(highImpactCutoff)],
        },
        data: { isActive: false },
      }),
      // CRITICAL impact
      prisma.storyCluster.updateMany({
        where: {
          isActive: true,
          impact: "CRITICAL",
          status: { notIn: ["STABLE", "RESOLVING"] },
          AND: [inactiveByActivityCutoff(criticalImpactCutoff)],
        },
        data: { isActive: false },
      }),
    ]);

  const deactivatedCount =
    stableResult.count +
    lowResult.count +
    mediumResult.count +
    highResult.count +
    criticalResult.count;

  if (deactivatedCount > 0) {
    console.log(`🧹 Deactivated ${deactivatedCount} stale story clusters`);
  }
}

export function clusterRankScore(cluster) {
  const impactScore =
    {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    }[cluster.impact] ?? 0;
  const activityAt = new Date(
    cluster.lastActivityAt || cluster.updatedAt || cluster.createdAt,
  ).getTime();
  const ageHours = Math.max(0, (Date.now() - activityAt) / (60 * 60 * 1000));
  const recencyScore = Math.max(0, 72 - ageHours) / 72;
  const articleScore = Math.min(cluster.articleCount || 0, 20) / 20;
  const sourceScore = Math.min(cluster.sourceCount || 0, 8) / 8;

  return impactScore * 4 + recencyScore * 3 + articleScore + sourceScore;
}

export function selectClusterCandidates(clusters, limit = 30) {
  return [...clusters]
    .sort((a, b) => clusterRankScore(b) - clusterRankScore(a))
    .slice(0, limit);
}

export function getArticleSignals(articles) {
  const sourceCounts = new Map();

  for (const article of articles) {
    const source = cleanString(article.source || article.rawArticle?.source);
    if (!source) continue;

    sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
  }

  const topSources = [...sourceCounts.entries()]
    .sort(([sourceA, countA], [sourceB, countB]) => {
      if (countA !== countB) return countB - countA;
      return sourceA.localeCompare(sourceB);
    })
    .slice(0, 5)
    .map(([source]) => source);

  return {
    articleCount: articles.length,
    sourceCount: sourceCounts.size,
    topSources,
  };
}

export function createArticleProcessor(
  batchSize = parseInt(process.env.AI_BATCH_SIZE) || 5,
) {
  const buffer = [];
  const processedArticlesBuffer = [];
  let currentBatchPromise = null;
  let flushPromise = null;

  async function scanLockedTopics(newArticles) {
    if (newArticles.length === 0) return;

    const activeTopics = await prisma.lockedTopic.findMany({
      where: { isActive: true },
    });

    if (activeTopics.length === 0) return;

    console.log(
      `🔍 Scanning ${newArticles.length} articles against ${activeTopics.length} locked topics...`,
    );

    for (const topic of activeTopics) {
      const matches = newArticles.filter((article) => {
        const content = (
          article.title +
          " " +
          (article.contentSnippet || "")
        ).toLowerCase();
        const queryTerms = topic.aiRefinedQuery
          .toLowerCase()
          .split(" ")
          .filter((t) => t.length > 2);
        if (queryTerms.length === 0) return false;
        return queryTerms.every((term) => content.includes(term));
      });

      if (matches.length > 0) {
        console.log(
          `   🎯 Found ${matches.length} matches for "${topic.displayName}"`,
        );

        for (const match of matches) {
          try {
            await prisma.topicFinding.upsert({
              where: {
                topicId_sourceUrl: {
                  topicId: topic.id,
                  sourceUrl: match.url,
                },
              },
              create: {
                topicId: topic.id,
                sourceType: "ARTICLE",
                sourceName: match.source,
                sourceUrl: match.url,
                title: match.title,
                summary: match.contentSnippet,
                publishedAt: match.publishedAt,
                relevanceScore: 0.85,
              },
              update: {},
            });
          } catch (err) {
            // Ignore upsert errors
          }
        }

        await prisma.lockedTopic.update({
          where: { id: topic.id },
          data: {
            matchCount: { increment: matches.length },
            lastMatchedAt: new Date(),
            lastScannedAt: new Date(),
          },
        });
      } else {
        await prisma.lockedTopic.update({
          where: { id: topic.id },
          data: { lastScannedAt: new Date() },
        });
      }
    }
  }

  function scheduleFlush() {
    if (!flushPromise) {
      flushPromise = _flush().finally(() => {
        flushPromise = null;
      });
    }

    return flushPromise;
  }

  async function _flush() {
    if (buffer.length === 0) return;

    if (currentBatchPromise) {
      await currentBatchPromise;
      return _flush();
    }

    // Fixed batch size of 30 protects the 512MB RAM microservice limit 
    // while completely avoiding token-counting overhead.
    const batch = buffer.splice(0, 30);

    if (batch.length === 0) {
      if (buffer.length > 0) {
        console.warn(
          `⚠️ Batch empty but buffer has ${buffer.length} items. Dropping first item to unblock.`,
        );
        buffer.shift();
        return _flush();
      }
      return;
    }

    console.log(
      `⚙️ Processing batch of ${batch.length} articles via Local Pipeline (Stage 1 + Stage 2)...`,
    );

    currentBatchPromise = (async () => {
      try {
        // Stage 1: Deterministic Enrichment
        const stage1Results = batch.map(article => ({
          article,
          stage1: enrichWithStage1(article)
        }));

        // Stage 2: Local ML Enrichment
        let stage2Results = [];
        try {
          stage2Results = await enrichWithStage2Batch(batch);
        } catch (err) {
          console.error(`⚠️ Stage 2 ML batch processing failed`, err.message);
          // Fallback if the Python microservice is completely down
          stage2Results = batch.map(article => ({ ...article, entities: [], sentimentScore: null }));
        }

        let successCount = 0;
        const successfullyProcessedArticles = [];

        // Save to DB sequentially to prevent 'connectOrCreate' unique constraint race conditions
        for (let i = 0; i < batch.length; i++) {
          const rawArticle = batch[i];
          const s1 = stage1Results[i].stage1;
          const s2 = stage2Results[i];

          const finalCats = s1.categories && s1.categories.length > 0 ? s1.categories : ["other"];

          const categoryOps = finalCats.map((cat) => ({
            where: { name: cat },
            create: { name: cat },
          }));

          try {
            await prisma.$transaction(
              async (tx) => {
                // Create ProcessedArticle
                await tx.processedArticle.create({
                  data: {
                    rawArticleId: rawArticle.id,
                    categories: { connectOrCreate: categoryOps },
                    entities: s2.entities || [],
                    sentimentScore: s2.sentimentScore || null,
                    biasNote: s1.biasNote || null,
                    eventRegion: s1.eventRegion || null,
                    perspectiveCountries: s1.perspectiveCountries || [],
                    model: "local-pipeline-v1",
                    clusterStatus: "HOLDING",
                  },
                });
              },
              {
                timeout: 15000,
              },
            );

            successCount++;
            successfullyProcessedArticles.push({
              ...rawArticle,
              categories: finalCats,
              entities: s2.entities || [],
              sentimentScore: s2.sentimentScore ?? null,
              eventRegion: s1.eventRegion || null,
              perspectiveCountries: s1.perspectiveCountries || [],
            });
          } catch (err) {
            console.error(
              `⚠️ Failed to save processed article: ${rawArticle.title}`,
              err.message,
            );
          }
        }

        console.log(`✅ Batch done: ${successCount}/${batch.length} succeeded`);

        if (successfullyProcessedArticles.length > 0) {
          await scanLockedTopics(successfullyProcessedArticles);
        }
      } catch (err) {
        console.error("❌ Batch processing failed:", err);
      }
    })();

    await currentBatchPromise;
    currentBatchPromise = null;

    if (buffer.length > 0) {
      return _flush();
    }
  }

  return {
    async add(rawArticle) {
      // Pre-check: skip if already processed (by rawArticleId)
      const exists = await prisma.processedArticle.findUnique({
        where: {
          rawArticleId: rawArticle.id,
        },
      });

      if (exists) {
        console.log(`⏭️ Already processed: ${rawArticle.title}`);
        return;
      }

      buffer.push(rawArticle);
      if (buffer.length >= batchSize && !currentBatchPromise) {
        scheduleFlush();
      }
    },
    async flush() {
      while (flushPromise || currentBatchPromise || buffer.length > 0) {
        if (flushPromise) {
          await flushPromise;
        } else if (currentBatchPromise) {
          await currentBatchPromise;
        } else {
          await scheduleFlush();
        }
      }
    },
  };
}
