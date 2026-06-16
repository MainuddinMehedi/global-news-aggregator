import "dotenv/config";
import { prisma } from "./db/prisma.js";
import { runScannersForTopic } from "./topics/scanner.js";
import revalidateCache from "./utils/revalidateCache.js";

// Allow triggering for a single topic via CLI args
const args = process.argv.slice(2);
const topicIdArg = args.find((a) => a.startsWith("--topic-id="));
const specificTopicId = topicIdArg ? topicIdArg.split("=")[1] : null;

async function run() {
  console.log("🚀 Starting Locked Topics background scanner...");

  const whereClause = { isActive: true };
  if (specificTopicId) {
    whereClause.id = specificTopicId;
  }

  const topics = await prisma.lockedTopic.findMany({
    where: whereClause,
  });

  if (topics.length === 0) {
    console.log("⚪ No active Locked Topics found.");
    await prisma.$disconnect();
    return;
  }

  let totalNewFindings = 0;

  for (const topic of topics) {
    // If scanning a specific topic, treat it as a full scan (skip date filtering)
    // Otherwise, it's the scheduled incremental scan.
    const isFullScan = !!specificTopicId;
    const insertedCount = await runScannersForTopic(topic, {
      fullScan: isFullScan,
    });
    totalNewFindings += insertedCount;
  }

  console.log(
    `\n✅ Finished scanning ${topics.length} topics. Found ${totalNewFindings} new findings total.`,
  );

  // --- REVALIDATION LOGIC ---
  if (totalNewFindings > 0 || specificTopicId) {
    const tags = ["locked-topics"];
    for (const topic of topics) {
      tags.push(`locked-topic-${topic.id}`);
    }
    await revalidateCache(tags);
  }

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error("❌ processTopics encountered an error:", err);
  process.exit(1);
});
