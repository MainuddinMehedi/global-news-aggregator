import { prisma } from "../db/client.js";
import { ALLOWED_CATEGORIES } from "./categories.js";
import { processBatchWithAI, processClusteringBatchWithAI } from "./client.js";
import { createNextBatch } from "./tokenBatcher.js";

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

function cleanString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeArticleCategory(category) {
  const normalized = cleanString(category)?.toLowerCase();
  if (!normalized) return null;

  return CATEGORY_ALIASES[normalized] || normalized;
}

function cleanNumber(value) {
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

function buildClusterUpdateData(clusterUpdate, existingCluster) {
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

async function applyClusterLifecycle() {
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

function clusterRankScore(cluster) {
  const impactScore =
    cluster.impactScore ??
    {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    }[cluster.impact] ??
    0;
  const activityAt = new Date(
    cluster.lastActivityAt || cluster.updatedAt || cluster.createdAt,
  ).getTime();
  const ageHours = Math.max(0, (Date.now() - activityAt) / (60 * 60 * 1000));
  const recencyScore = Math.max(0, 72 - ageHours) / 72;
  const articleScore = Math.min(cluster.articleCount || 0, 20) / 20;
  const sourceScore = Math.min(cluster.sourceCount || 0, 8) / 8;

  return impactScore * 4 + recencyScore * 3 + articleScore + sourceScore;
}

function selectClusterCandidates(clusters, limit = 30) {
  return [...clusters]
    .sort((a, b) => clusterRankScore(b) - clusterRankScore(a))
    .slice(0, limit);
}

async function getClusterSignals(clusterId) {
  const cluster = await prisma.storyCluster.findUnique({
    where: { id: clusterId },
    select: {
      articles: {
        select: {
          rawArticle: {
            select: { source: true },
          },
        },
      },
    },
  });

  if (!cluster) {
    return {
      articleCount: 0,
      sourceCount: 0,
      topSources: [],
    };
  }

  const sourceCounts = new Map();
  for (const article of cluster.articles) {
    const source = cleanString(article.rawArticle?.source);
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
    articleCount: cluster.articles.length,
    sourceCount: sourceCounts.size,
    topSources,
  };
}

function getArticleSignals(articles) {
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
  let currentBatchPromise = null;
  let flushPromise = null;

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

    const { batch, remainingArticles, estimatedTokens } = createNextBatch(
      buffer,
      800,
    );
    // update buffer
    buffer.length = 0;
    buffer.push(...remainingArticles);

    if (batch.length === 0) {
      if (buffer.length > 0) {
        // First article might be too large and stuck? Actually prepareArticle handles it or drops it.
        // If batch is empty but buffer isn't, maybe we need to drop the first to unblock.
        console.warn(
          `⚠️ Batch empty but buffer has ${buffer.length} items. Dropping first item to unblock.`,
        );
        buffer.shift();
        return _flush();
      }
      return;
    }

    console.log(
      `🤖 Processing batch of ${batch.length} articles (Estimated tokens: ${estimatedTokens})...`,
    );

    currentBatchPromise = (async () => {
      try {
        const batchWithRefs = batch.map((article, index) => ({
          ...article,
          aiRef: `article_${index + 1}`,
        }));

        let aiResponse;
        try {
          aiResponse = await processBatchWithAI(batchWithRefs, estimatedTokens);
        } catch (err) {
          console.error(`⚠️ AI batch processing failed`, err.message);
          throw err;
        }

        let parsed;
        try {
          parsed = JSON.parse(
            aiResponse.content.replace(/```json|```/g, "").trim(),
          );
          if (!parsed.results || !Array.isArray(parsed.results)) {
            throw new Error("Invalid format: missing 'results' array");
          }
        } catch (err) {
          console.warn(`⚠️ Invalid JSON from AI for batch`);
          parsed = { results: [] };
        }

        const resultsMap = new Map();
        const validBatchRefs = new Set(
          batchWithRefs.map((article) => article.aiRef),
        );
        const batchRefsByArticleId = new Map(
          batchWithRefs.map((article) => [article.id, article.aiRef]),
        );
        parsed.results.forEach((res, index) => {
          if (!res) return;

          const ref =
            cleanString(res.ref) ||
            cleanString(res.articleRef) ||
            cleanString(res.id);
          let mappedRef = batchRefsByArticleId.get(ref) || ref;

          if (!validBatchRefs.has(mappedRef)) {
            const fallbackRef = batchWithRefs[index]?.aiRef;

            if (fallbackRef) {
              console.warn(
                `⚠️ Recovered AI article result with invalid ref "${ref}" using batch position ${index + 1}`,
              );
              mappedRef = fallbackRef;
            }
          }

          if (validBatchRefs.has(mappedRef)) resultsMap.set(mappedRef, res);
        });

        let successCount = 0;
        const successfullyProcessedArticles = [];

        // Save to DB sequentially to prevent 'connectOrCreate' unique constraint race conditions
        for (const article of batchWithRefs) {
          const rawArticle = article;
          const articleParsed = resultsMap.get(rawArticle.aiRef) || {
            categories: ["other"],
            entities: [],
            sentimentScore: 0,
            biasNote: "",
            perspectiveCountries: [],
          };

          const rawCats = Array.isArray(articleParsed.categories)
            ? articleParsed.categories
            : [];
          const normalizedCats = [
            ...new Set(rawCats.map(normalizeArticleCategory).filter(Boolean)),
          ];
          const validCats = normalizedCats.filter((c) =>
            ALLOWED_CATEGORIES.includes(c),
          );
          const finalCats = validCats.length > 0 ? validCats : ["other"];

          if (normalizedCats.length !== validCats.length) {
            const dropped = normalizedCats.filter(
              (c) => !ALLOWED_CATEGORIES.includes(c),
            );
            console.warn(
              `⚠️ Dropped unrecognized categories for "${rawArticle.title}": [${dropped.join(", ")}]`,
            );
          }

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
                    entities: articleParsed.entities || [],
                    sentimentScore: articleParsed.sentimentScore || null,
                    biasNote: articleParsed.biasNote || null,
                    biasCategory: articleParsed.biasCategory || null,
                    perspectiveCountries:
                      articleParsed.perspectiveCountries || [],
                    model: aiResponse.model,
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
              entities: Array.isArray(articleParsed.entities)
                ? articleParsed.entities
                : [],
              sentimentScore: articleParsed.sentimentScore ?? null,
              biasCategory: articleParsed.biasCategory || null,
              perspectiveCountries: Array.isArray(
                articleParsed.perspectiveCountries,
              )
                ? articleParsed.perspectiveCountries
                : [],
            });
          } catch (err) {
            console.error(
              `⚠️ Failed to save processed article: ${rawArticle.title}`,
              err.message,
            );
          }
        }

        // Log AI Usage ONCE per batch
        try {
          const today = new Date().toISOString().split("T")[0];
          const costPer1k = 0.0006;
          const estimatedCost = (aiResponse.tokensUsed / 1000) * costPer1k;

          await prisma.aiUsage.create({
            data: {
              date: today,
              provider: aiResponse.provider,
              model: aiResponse.model,
              tokensUsed: aiResponse.tokensUsed,
              estimatedCost: estimatedCost,
              success: true,
            },
          });
        } catch (err) {
          console.error(`⚠️ Failed to log AI usage for batch`, err.message);
        }

        console.log(`✅ Batch done: ${successCount}/${batch.length} succeeded`);

        // ==========================================
        // 2. PASS: STORY CLUSTERING
        // ==========================================
        if (successfullyProcessedArticles.length > 0) {
          try {
            console.log(
              `🤖 Running clustering pass for ${successfullyProcessedArticles.length} articles...`,
            );

            const articleIdByRef = new Map(
              successfullyProcessedArticles.map((article) => [
                article.aiRef,
                article.id,
              ]),
            );
            const processedArticleIds = new Set(
              successfullyProcessedArticles.map((article) => article.id),
            );

            await applyClusterLifecycle();

            // Fetch and rank active clusters to provide focused context to the AI.
            const activeClusterCandidates = await prisma.storyCluster.findMany({
              where: { isActive: true },
              orderBy: [{ lastActivityAt: "desc" }, { updatedAt: "desc" }],
              take: 60,
              include: {
                articles: {
                  take: 3,
                  orderBy: { processedAt: "desc" },
                  include: {
                    rawArticle: true,
                    categories: true,
                  },
                },
              },
            });
            const activeClusters = selectClusterCandidates(
              activeClusterCandidates,
              30,
            );
            const activeClustersWithRefs = activeClusters.map(
              (cluster, index) => ({
                ...cluster,
                aiRef: `cluster_${index + 1}`,
              }),
            );

            const lifecycleConfig = {
              low: CLUSTER_LOW_IMPACT_INACTIVE_DAYS,
              medium: CLUSTER_MEDIUM_IMPACT_INACTIVE_DAYS,
              high: CLUSTER_HIGH_IMPACT_INACTIVE_DAYS,
              critical: CLUSTER_CRITICAL_IMPACT_INACTIVE_DAYS,
            };

            // Make the clustering AI request
            const clusteringResponse = await processClusteringBatchWithAI(
              successfullyProcessedArticles,
              activeClustersWithRefs,
              500,
              lifecycleConfig,
            );

            let clusterData;
            try {
              clusterData = JSON.parse(
                clusteringResponse.content.replace(/```json|```/g, "").trim(),
              );
            } catch (err) {
              console.warn(`⚠️ Invalid JSON from clustering AI`);
              clusterData = { assignments: [], newClusters: [] };
            }

            const assignments = Array.isArray(clusterData.assignments)
              ? clusterData.assignments
              : [];
            const newClusters = Array.isArray(clusterData.newClusters)
              ? clusterData.newClusters
              : [];
            const clusterUpdates = Array.isArray(clusterData.clusterUpdates)
              ? clusterData.clusterUpdates
              : [];

            const activeClusterIds = new Set(activeClusters.map((c) => c.id));
            const activeClustersById = new Map(
              activeClusters.map((cluster) => [cluster.id, cluster]),
            );
            const clusterIdByRef = new Map(
              activeClustersWithRefs.map((cluster) => [
                cluster.aiRef,
                cluster.id,
              ]),
            );
            const resolveArticleId = (refOrId) =>
              articleIdByRef.get(refOrId) ||
              (processedArticleIds.has(refOrId) ? refOrId : null);
            const resolveClusterId = (refOrId) =>
              clusterIdByRef.get(refOrId) ||
              (activeClusterIds.has(refOrId) ? refOrId : null);
            const clusterUpdatesById = new Map(
              clusterUpdates
                .filter((update) => {
                  const clusterId = resolveClusterId(
                    cleanString(update?.clusterRef) ||
                      cleanString(update?.clusterId),
                  );

                  return Boolean(clusterId);
                })
                .map((update) => {
                  const clusterId = resolveClusterId(
                    cleanString(update.clusterRef) ||
                      cleanString(update.clusterId),
                  );

                  return [
                    clusterId,
                    buildClusterUpdateData(
                      update,
                      activeClustersById.get(clusterId),
                    ),
                  ];
                }),
            );

            // Save new clusters
            for (const nc of newClusters) {
              try {
                // Ensure articleIds is an array and filter out any invalid/null IDs
                const rawArticleRefs = Array.isArray(nc.articleRefs)
                  ? nc.articleRefs
                  : Array.isArray(nc.articleIds)
                    ? nc.articleIds
                    : [];
                const validArticleIds = rawArticleRefs
                  .map((refOrId) => resolveArticleId(cleanString(refOrId)))
                  .filter(Boolean);

                const uniqueArticleIds = [...new Set(validArticleIds)];

                const invalidArticleRefs = rawArticleRefs.filter(
                  (refOrId) => !resolveArticleId(cleanString(refOrId)),
                );

                if (invalidArticleRefs.length > 0) {
                  console.warn(
                    `⚠️ Ignoring invalid article refs for new cluster "${nc.title}": [${invalidArticleRefs.join(", ")}]`,
                  );
                }

                if (uniqueArticleIds.length === 0) {
                  console.warn(
                    `⚠️ Skipping new cluster "${nc.title}" because it has no valid processed articles`,
                  );
                  continue;
                }

                const clusterSignals = getArticleSignals(
                  successfullyProcessedArticles.filter((article) =>
                    uniqueArticleIds.includes(article.id),
                  ),
                );
                const articlesToConnect = uniqueArticleIds.map((id) => ({
                  rawArticleId: id,
                }));

                // Generate a simple slug
                const baseSlug = (nc.title || "story")
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)+/g, "");
                const randomSuffix = Math.random().toString(36).substring(2, 7);
                let slug = `${baseSlug}-${randomSuffix}`;

                // Check slug exists, retry with new suffix if so
                const existing = await prisma.storyCluster.findUnique({
                  where: { slug },
                });
                if (existing) {
                  slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
                }

                await prisma.storyCluster.create({
                  data: {
                    slug: slug,
                    title: nc.title,
                    summary: nc.summary,
                    timeWindow: nc.timeWindow || "Just Started",
                    impact: nc.impact || null,
                    status: nc.status || null,
                    whyItMatters: nc.whyItMatters || null,
                    regions: nc.regions || [],
                    themes: nc.themes || [],
                    keyDevelopments: nc.keyDevelopments || [],
                    lastActivityAt: new Date(),
                    articleCount: clusterSignals.articleCount,
                    sourceCount: clusterSignals.sourceCount,
                    topSources: clusterSignals.topSources,
                    articles: {
                      connect: articlesToConnect,
                    },
                  },
                });
                console.log(`+ Created new cluster: "${nc.title}"`);
              } catch (err) {
                console.error(
                  `⚠️ Failed to create new cluster: ${nc.title}`,
                  err.message,
                );
              }
            }

            // Update existing cluster assignments
            const assignedClusterIdsToRefresh = new Set();

            for (const assignment of assignments) {
              const articleRef =
                cleanString(assignment.articleRef) ||
                cleanString(assignment.articleId);
              const clusterRef =
                cleanString(assignment.clusterRef) ||
                cleanString(assignment.clusterId);

              if (!articleRef || !clusterRef) continue;

              const articleId = resolveArticleId(articleRef);
              const clusterId = resolveClusterId(clusterRef);
              const confidence = cleanNumber(assignment.confidence);

              if (!articleId) {
                console.warn(
                  `⚠️ Ignoring assignment for unknown or unprocessed article ref ${articleRef}`,
                );
                continue;
              }
              if (!clusterId) {
                console.warn(
                  `⚠️ Ignoring assignment to unknown cluster ref ${clusterRef}`,
                );
                continue;
              }
              if (
                confidence !== undefined &&
                confidence < CLUSTER_ASSIGNMENT_MIN_CONFIDENCE
              ) {
                console.warn(
                  `⚠️ Ignoring low-confidence assignment ${articleRef} -> ${clusterRef} (${confidence})`,
                );
                continue;
              }
              try {
                await prisma.processedArticle.update({
                  where: { rawArticleId: articleId },
                  data: {
                    storyClusters: {
                      connect: { id: clusterId },
                    },
                  },
                });
                assignedClusterIdsToRefresh.add(clusterId);
              } catch (err) {
                console.error(
                  `⚠️ Failed to assign article ${articleRef} to cluster ${clusterRef}`,
                  err.message,
                );
              }
            }

            for (const clusterId of assignedClusterIdsToRefresh) {
              try {
                const clusterUpdate = clusterUpdatesById.get(clusterId) || {};
                const clusterSignals = await getClusterSignals(clusterId);

                // Evolve the cluster dossier while refreshing freshness counters.
                await prisma.storyCluster.update({
                  where: { id: clusterId },
                  data: {
                    ...clusterUpdate,
                    ...clusterSignals,
                    updatedAt: new Date(),
                    lastActivityAt: new Date(),
                  },
                });
              } catch (err) {
                console.error(
                  `⚠️ Failed to refresh cluster ${clusterId}`,
                  err.message,
                );
              }
            }

            // Log AI Usage for clustering
            try {
              const today = new Date().toISOString().split("T")[0];
              const costPer1k = 0.0006;
              const estimatedCost =
                (clusteringResponse.tokensUsed / 1000) * costPer1k;
              await prisma.aiUsage.create({
                data: {
                  date: today,
                  provider: clusteringResponse.provider,
                  model: clusteringResponse.model,
                  tokensUsed: clusteringResponse.tokensUsed,
                  estimatedCost: estimatedCost,
                  success: true,
                },
              });
            } catch (err) {
              console.error(
                `⚠️ Failed to log AI usage for clustering batch`,
                err.message,
              );
            }
          } catch (err) {
            console.error(`❌ Clustering pass failed:`, err);
          }
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
