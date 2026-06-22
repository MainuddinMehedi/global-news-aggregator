import { prisma } from "../../db/prisma.js";
import { generateEmbeddingsBatch } from "../ai/embeddings.js";

async function backfillLockedTopicEmbeddings() {
  console.log("🚀 Starting LockedTopic Embeddings Backfill...");

  try {
    // 1. Fetch all topics where queryEmbedding is null
    const topicsToBackfill = await prisma.$queryRaw`
      SELECT id, "displayName", "aiQuerySummary", "aiRefinedQuery" 
      FROM "LockedTopic" 
      WHERE "queryEmbedding" IS NULL
    `;

    if (!topicsToBackfill || topicsToBackfill.length === 0) {
      console.log("✅ All LockedTopics already have embeddings. Nothing to do.");
      process.exit(0);
    }

    console.log(`📌 Found ${topicsToBackfill.length} topics to backfill.`);

    const batchSize = 100;
    for (let i = 0; i < topicsToBackfill.length; i += batchSize) {
      const batch = topicsToBackfill.slice(i, i + batchSize);
      console.log(`Processing batch ${i / batchSize + 1} (${batch.length} topics)...`);

      // 2. Prepare text to embed
      const textsToEmbed = batch.map(topic => 
        `${topic.displayName}\n\n${topic.aiQuerySummary}\n\n${topic.aiRefinedQuery}`
      );

      // 3. Generate embeddings
      const embeddings = await generateEmbeddingsBatch(textsToEmbed);

      // 4. Update the DB
      let updatedCount = 0;
      for (let j = 0; j < batch.length; j++) {
        const topic = batch[j];
        const vector = embeddings[j];

        if (vector) {
          await prisma.$executeRaw`
            UPDATE "LockedTopic"
            SET "queryEmbedding" = ${vector}::vector
            WHERE id = ${topic.id}
          `;
          updatedCount++;
        }
      }
      console.log(`✅ Successfully updated ${updatedCount}/${batch.length} topics in this batch.`);
    }

    console.log("🎉 Backfill complete!");
  } catch (error) {
    console.error("❌ Backfill failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backfillLockedTopicEmbeddings();
