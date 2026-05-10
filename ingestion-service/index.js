import "dotenv/config";
import { prisma } from "./db/prisma.js";
import fetchRSSStream from "./sources/rss.js";
import { getActiveFeeds } from "./sources/feeds.js";
import hashSnippet from "./utils/hashSnippet.js";
import normalizeUrl from "./utils/normalizeUrl.js";
import { createArticleProcessor } from "./ai/processor.js";

function generateSlug(title) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const shortId = Math.random().toString(36).substring(2, 8);
  return `${base.substring(0, 80)}-${shortId}`;
}

// ── CLI Flags ────────────────────────────────────────────────
const args = process.argv.slice(2);
const skipAI = args.includes("--skip-ai");
const aiLimitArg = args.find((a) => a.startsWith("--ai-limit="));
const aiLimit = aiLimitArg ? parseInt(aiLimitArg.split("=")[1]) : Infinity;

const aiProcessor = skipAI ? null : createArticleProcessor();
const sources = getActiveFeeds();

const startTime = Date.now();

async function run() {
  // ── Log run mode ──
  if (skipAI) {
    console.log("🚀 Running in RAW-ONLY mode (--skip-ai): no AI processing\n");
  } else if (aiLimit < Infinity) {
    console.log(`🚀 Running with AI limit: ${aiLimit} articles max\n`);
  }

  let totalFetched = 0;
  let totalInserted = 0;
  let totalDupes = 0;
  let aiQueued = 0;

  for (const src of sources) {
    console.log(`\n📡 Streaming..: ${src.name} (${src.sourceCountry})\n`);

    for await (const item of fetchRSSStream(
      src.name,
      src.sourceCountry,
      src.url,
    )) {
      totalFetched++;

      const normUrl = normalizeUrl(item.url);
      if (!normUrl) continue;

      // Dedup 1: URL
      const existingUrl = await prisma.rawArticle.findUnique({
        where: { url: normUrl },
        select: { id: true },
      });
      if (existingUrl) {
        totalDupes++;
        continue;
      }

      // Dedup 2: Content Hash (fallback)
      const hash = hashSnippet(item.title + item.contentSnippet);
      const existingHash = await prisma.rawArticle.findFirst({
        where: { contentHash: hash },
        select: { id: true },
      });
      if (existingHash) {
        totalDupes++;
        continue;
      }

      // Save directly to DB
      item.url = normUrl;
      item.contentHash = hash;

      try {
        const rawArticle = await prisma.rawArticle.create({
          data: {
            title: item.title,
            url: item.url,
            contentSnippet: item.contentSnippet,
            source: item.source,
            sourceCountry: item.sourceCountry,
            publishedAt: item.publishedAt,
            contentHash: item.contentHash,
            slug: generateSlug(item.title),
          },
        });
        totalInserted++;
        console.log(`+ Inserted: ${item.title}`);

        // Add to AI Processing Queue (if enabled and under limit)
        if (aiProcessor && aiQueued < aiLimit) {
          await aiProcessor.add(rawArticle);
          aiQueued++;
        }
      } catch (err) {
        console.error(`- Failed to insert: ${item.title}`, err.message);
      }
    }
  }

  if (aiProcessor) {
    console.log("\n🤖 Flushing remaining AI tasks...");
    await aiProcessor.flush();
    await aiProcessor.runClustering();
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // --- REVALIDATION LOGIC ---
  try {
    const nextApiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const revalidateSecret = process.env.REVALIDATE_SECRET || "";

    console.log(`\n🔄 Revalidating cache...`);

    const tagsToRevalidate = ["articles", "stories", "locked-topics"];

    // Find clusters updated during this run to revalidate their specific pages
    const updatedClusters = await prisma.storyCluster.findMany({
      where: {
        updatedAt: {
          gte: new Date(startTime),
        },
      },
      select: { slug: true },
    });

    updatedClusters.forEach((cluster) => {
      if (cluster.slug) {
        tagsToRevalidate.push(`story-${cluster.slug}`);
      }
    });

    // Find locked topics updated during this run
    const updatedTopics = await prisma.lockedTopic.findMany({
      where: {
        updatedAt: {
          gte: new Date(startTime),
        },
      },
      select: { id: true },
    });

    updatedTopics.forEach((topic) => {
      tagsToRevalidate.push(`locked-topic-${topic.id}`);
    });

    for (const tag of tagsToRevalidate) {
      const res = await fetch(
        `${nextApiUrl}/revalidate?tag=${tag}&secret=${revalidateSecret}`,
      );
      if (!res.ok) {
        console.warn(`⚠️ Failed to revalidate tag: ${tag} (${res.status})`);
      } else {
        console.log(`✓ Revalidated: ${tag}`);
      }
    }
  } catch (err) {
    console.error("⚠️ Cache revalidation failed:", err.message);
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ Ingestion complete in ${elapsed}s`);
  console.log(
    `   📥 Fetched: ${totalFetched} items from ${sources.length} sources`,
  );
  console.log(`   ➕ Inserted: ${totalInserted} new articles`);
  console.log(`   🔁 Duplicates skipped: ${totalDupes}`);
  if (!skipAI) {
    console.log(
      `   🤖 AI queued: ${aiQueued}${aiLimit < Infinity ? ` (limit: ${aiLimit})` : ""}`,
    );
  }
  console.log(`${"─".repeat(50)}\n`);

  await prisma.$disconnect();
}

run().catch((err) => console.error("Worker encountered an error:", err));
