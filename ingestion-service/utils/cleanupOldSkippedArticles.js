import { prisma } from "../db/prisma.js";

/**
 * Automatically deletes RawArticles (and cascade-deletes their ProcessedArticles)
 * that are older than 30 days and have a clusterStatus of "SKIPPED".
 */
export default async function cleanupOldSkippedArticles() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  try {
    console.log("🧹 Running daily purge of skipped other articles older than 30 days...");
    const result = await prisma.rawArticle.deleteMany({
      where: {
        fetchedAt: { lt: thirtyDaysAgo },
        processedArticle: {
          clusterStatus: "SKIPPED",
        },
      },
    });
    if (result.count > 0) {
      console.log(`🗑️ Auto-purged ${result.count} skipped other articles older than 30 days.`);
    } else {
      console.log("✓ No expired skipped articles found.");
    }
  } catch (err) {
    console.error("⚠️ Failed to execute skipped articles purge:", err.message);
  }
}
