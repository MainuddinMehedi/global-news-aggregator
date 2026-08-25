import { prisma } from "../ingestion-service/db/prisma.js";

async function dropIndexes() {
  console.log("🧹 Dropping custom pgvector indexes to bypass Prisma drift checks...");

  try {
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS idx_processed_article_embedding;`);
    console.log("✅ Dropped idx_processed_article_embedding.");

    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS idx_locked_topic_query_embedding;`);
    console.log("✅ Dropped idx_locked_topic_query_embedding.");

    console.log("🎉 Ready for `npx prisma migrate dev`!");
  } catch (error) {
    console.error("❌ Failed to drop indexes:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

dropIndexes();
