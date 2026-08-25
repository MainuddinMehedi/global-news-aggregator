import { prisma } from "../ingestion-service/db/prisma.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



async function restoreIndexes() {
  console.log("🚀 Starting to restore custom pgvector indexes...");

  try {
    const articleIdxSql = fs.readFileSync(path.join(__dirname, "../prisma/add_embedding_index.sql"), "utf8");
    const topicIdxSql = fs.readFileSync(path.join(__dirname, "../prisma/add_locked_topic_embedding_index.sql"), "utf8");

    console.log("⏳ Applying ProcessedArticle embedding index...");
    await prisma.$executeRawUnsafe(articleIdxSql);
    console.log("✅ ProcessedArticle index restored.");

    console.log("⏳ Applying LockedTopic embedding index...");
    await prisma.$executeRawUnsafe(topicIdxSql);
    console.log("✅ LockedTopic index restored.");

    console.log("🎉 All custom indexes successfully restored!");
  } catch (error) {
    console.error("❌ Failed to restore indexes:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restoreIndexes();
