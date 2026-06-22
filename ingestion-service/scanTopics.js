import "dotenv/config";
import { prisma } from "./db/prisma.js";
import { runScannersForTopic } from "./topics/scanner.js";
import revalidateCache from "./utils/revalidateCache.js";
import { startTaskLogging, updateTaskHeartbeat, completeTaskLogging } from "./utils/taskLogger.js";
import { loadConfigOverrides } from "./ai/aiConfig.js";

// Allow triggering for a single topic via CLI args
const args = process.argv.slice(2);
const topicIdArg = args.find((a) => a.startsWith("--topic-id="));
const specificTopicId = topicIdArg ? topicIdArg.split("=")[1] : null;

export async function scanTopicsLogic(topicId = null) {
  const taskId = await startTaskLogging("locked-topic-scan");
  try {
    await loadConfigOverrides(prisma);
    const effectiveTopicId = topicId || specificTopicId;
    console.log(`🚀 Starting Locked Topics background scanner${effectiveTopicId ? ` for topic ${effectiveTopicId}` : ""}...`);

    const whereClause = { isActive: true };
    if (effectiveTopicId) {
      whereClause.id = effectiveTopicId;
    }

    const topics = await prisma.lockedTopic.findMany({
      where: whereClause,
    });

    if (topics.length > 0) {
      const topicIds = topics.map(t => t.id);
      const embeddings = await prisma.$queryRaw`
        SELECT id, "queryEmbedding"::text as "queryEmbedding" 
        FROM "LockedTopic" 
        WHERE id = ANY(${topicIds}::uuid[])
      `;
      const embeddingMap = new Map(embeddings.map(e => [e.id, e.queryEmbedding]));
      for (const topic of topics) {
        topic.queryEmbedding = embeddingMap.get(topic.id) || null;
      }
    }

    if (topics.length === 0) {
      console.log("⚪ No active Locked Topics found.");
      await completeTaskLogging(taskId, "SUCCESS", { topicsScanned: 0, findingsCount: 0 });
      await prisma.$disconnect();
      return 0;
    }

  let totalNewFindings = 0;

  for (const topic of topics) {
    await updateTaskHeartbeat(taskId);
    try {
      // If scanning a specific topic, treat it as a full scan (skip date filtering)
      // Otherwise, it's the scheduled incremental scan.
      const isFullScan = !!effectiveTopicId;
      const insertedCount = await runScannersForTopic(topic, {
        fullScan: isFullScan,
      });
      totalNewFindings += insertedCount;
    } catch (err) {
      console.error(`❌ [scanTopics] Scanning failed for topic ${topic.id} ("${topic.displayName}"):`, err);
      // Continue to next topic
    }
  }

  console.log(
    `\n✅ Finished scanning ${topics.length} topics. Found ${totalNewFindings} new findings total.`,
  );

  // --- REVALIDATION LOGIC ---
  if (totalNewFindings > 0 || effectiveTopicId) {
    const tags = ["locked-topics"];
    for (const topic of topics) {
      tags.push(`locked-topic-${topic.id}`);
    }
    await revalidateCache(tags);
  }

  await completeTaskLogging(taskId, "SUCCESS", {
    topicsScanned: topics.length,
    findingsCount: totalNewFindings,
  });
  return totalNewFindings;
} catch (err) {
  console.error("Locked topic scan failed:", err);
  await completeTaskLogging(taskId, "FAILED", null, err.message);
  throw err;
} finally {
  await prisma.$disconnect();
}
}

// Run if called directly from CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const topicIdArg = args.find((a) => a.startsWith("--topic-id="));
  const cliTopicId = topicIdArg ? topicIdArg.split("=")[1] : null;

  scanTopicsLogic(cliTopicId).catch((err) => {
    console.error("❌ scanTopics encountered an error:", err);
    process.exit(1);
  });
}
