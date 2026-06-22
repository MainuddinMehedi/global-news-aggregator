import { prisma } from "../db/prisma.js";
import { getArticleSignals } from "./utils/overlap.js";
import revalidateCache from "../utils/revalidateCache.js";

const threshold = Number.parseFloat(process.env.CLUSTER_DEDUPLICATION_THRESHOLD || "0.15");

function dotProduct(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

function magnitude(a) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * a[i];
  return Math.sqrt(sum);
}

function cosineDistance(a, b) {
  const dot = dotProduct(a, b);
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 1.0;
  const similarity = dot / (magA * magB);
  // Cap similarity to avoid float precision overflow (e.g. 1.0000000000000002)
  const clampedSimilarity = Math.max(-1.0, Math.min(1.0, similarity));
  return 1.0 - clampedSimilarity;
}

function parseVector(emb) {
  if (!emb) return null;
  if (Array.isArray(emb)) return emb;
  if (typeof emb === "string") {
    try {
      return JSON.parse(emb);
    } catch {
      return emb.replace(/[\[\]]/g, "").split(",").map(Number);
    }
  }
  return null;
}

function findClusterMedoid(cluster) {
  const articles = cluster.articles || [];
  // Sort articles explicitly by processedAt descending to get the most recent articles first
  const sortedArticles = [...articles].sort((a, b) => {
    const timeA = new Date(a.processedAt || 0).getTime();
    const timeB = new Date(b.processedAt || 0).getTime();
    return timeB - timeA;
  });
  // Slice to only evaluate the last 20 articles to prevent O(N^2) scaling issues
  const validArticles = sortedArticles
    .slice(0, 20)
    .map(art => ({ id: art.id, embedding: parseVector(art.embedding) }))
    .filter(art => art.embedding && art.embedding.length > 0);

  if (validArticles.length === 0) return null;
  if (validArticles.length === 1) return validArticles[0];

  let bestMedoid = null;
  let minAvgDistance = Infinity;

  for (let i = 0; i < validArticles.length; i++) {
    let sumDistance = 0;
    const a = validArticles[i].embedding;
    for (let j = 0; j < validArticles.length; j++) {
      if (i === j) continue;
      const b = validArticles[j].embedding;
      sumDistance += cosineDistance(a, b);
    }
    const avgDistance = sumDistance / (validArticles.length - 1);
    if (avgDistance < minAvgDistance) {
      minAvgDistance = avgDistance;
      bestMedoid = validArticles[i];
    }
  }

  return bestMedoid;
}

export async function deduplicateActiveClusters() {
  console.log("🔍 Running active story clusters deduplication pass...");

  // Fetch all active clusters with all their articles containing embeddings using raw SQL (Prisma excludes Unsupported fields from select/where)
  const rawResults = await prisma.$queryRaw`
    SELECT c.id AS cluster_id, c.title AS cluster_title, c."createdAt" AS cluster_created_at, c."lastActivityAt" AS cluster_last_activity_at,
           p.id AS article_id, p.embedding AS article_embedding, p."processedAt" AS article_processed_at
    FROM "StoryCluster" c
    JOIN "_ArticleStoryClusters" sc_art ON c.id = sc_art."B"
    JOIN "ProcessedArticle" p ON sc_art."A" = p.id
    WHERE c."isActive" = true
      AND p.embedding IS NOT NULL
    ORDER BY c.id, p."processedAt" DESC;
  `;

  // Group flat database results by cluster ID
  const clusterMap = new Map();
  for (const row of rawResults) {
    if (!clusterMap.has(row.cluster_id)) {
      clusterMap.set(row.cluster_id, {
        id: row.cluster_id,
        title: row.cluster_title,
        createdAt: new Date(row.cluster_created_at),
        lastActivityAt: row.cluster_last_activity_at ? new Date(row.cluster_last_activity_at) : null,
        articles: []
      });
    }
    clusterMap.get(row.cluster_id).articles.push({
      id: row.article_id,
      embedding: row.article_embedding,
      processedAt: new Date(row.article_processed_at)
    });
  }
  const activeClusters = Array.from(clusterMap.values());

  if (activeClusters.length < 2) {
    console.log("⏭️ Too few active clusters to deduplicate.");
    return;
  }

  // 1. Calculate medoids for each active cluster
  const clusterMedoids = new Map();
  for (const cluster of activeClusters) {
    const medoid = findClusterMedoid(cluster);
    if (medoid) {
      clusterMedoids.set(cluster.id, medoid.embedding);
    }
  }

  let mergedCount = 0;
  const mergedClusterIds = new Set();

  // 2. Perform pairwise comparisons
  for (let i = 0; i < activeClusters.length; i++) {
    const c1 = activeClusters[i];
    if (mergedClusterIds.has(c1.id)) continue;

    const m1 = clusterMedoids.get(c1.id);
    if (!m1) continue;

    for (let j = i + 1; j < activeClusters.length; j++) {
      const c2 = activeClusters[j];
      if (mergedClusterIds.has(c2.id)) continue;

      const m2 = clusterMedoids.get(c2.id);
      if (!m2) continue;

      const distance = cosineDistance(m1, m2);
      if (distance < threshold) {
        console.log(`🎯 Found duplicate clusters: "${c1.title}" and "${c2.title}" (distance: ${distance.toFixed(4)})`);

        // Identify older and newer clusters based on database ID/creation
        const cOld = c1.createdAt < c2.createdAt ? c1 : c2;
        const cNew = cOld.id === c1.id ? c2 : c1;

        console.log(`🔄 Merging newer cluster "${cNew.title}" (ID: ${cNew.id}) into older cluster "${cOld.title}" (ID: ${cOld.id})...`);

        try {
          // Perform database updates atomically within a transaction
          await prisma.$transaction(async (tx) => {
            // Update raw join table to point articles of cNew to cOld
            await tx.$executeRaw`
              UPDATE "_ArticleStoryClusters"
              SET "B" = ${cOld.id}
              WHERE "B" = ${cNew.id}
                AND "A" NOT IN (
                  SELECT "A" FROM "_ArticleStoryClusters" WHERE "B" = ${cOld.id}
                )
            `;

            // Delete remaining duplicates connecting to cNew
            await tx.$executeRaw`
              DELETE FROM "_ArticleStoryClusters"
              WHERE "B" = ${cNew.id}
            `;

            // Mark cNew as inactive
            await tx.storyCluster.update({
              where: { id: cNew.id },
              data: { isActive: false }
            });
          });

          // Fetch combined articles to rebuild metadata
          const combinedArticles = await prisma.processedArticle.findMany({
            where: { storyClusters: { some: { id: cOld.id } } },
            include: { rawArticle: true, categories: true }
          });

          const clusterSignals = getArticleSignals(combinedArticles);
          const newLastActivityAt = cOld.lastActivityAt > cNew.lastActivityAt ? cOld.lastActivityAt : cNew.lastActivityAt;

          await prisma.storyCluster.update({
            where: { id: cOld.id },
            data: {
              ...clusterSignals,
              lastActivityAt: newLastActivityAt,
              updatedAt: new Date()
            }
          });

          mergedClusterIds.add(cNew.id);
          mergedCount++;
          console.log(`✅ Successfully merged clusters. Old cluster now has ${combinedArticles.length} articles.`);
          
          // Break inner loop since c1 might have been deactivated or merged
          if (cNew.id === c1.id) {
            break;
          }
        } catch (err) {
          console.error(`🚨 Transaction failed to merge cluster ${cNew.id} into ${cOld.id}:`, err.message);
        }
      }
    }
  }

  if (mergedCount > 0) {
    console.log(`🧹 Post-run deduplication complete. Merged ${mergedCount} duplicate clusters.`);
    await revalidateCache(["articles", "stories"]);
  } else {
    console.log("✅ No duplicate clusters found.");
  }
}
