import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../ingestion-service/db/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("📤 Exporting FeedSources from Database to local JSON...\n");

  const feeds = await prisma.feedSource.findMany({
    select: {
      name: true,
      sourceCountry: true,
      sourceType: true,
      biasGroup: true,
      coverageScope: true,
      url: true,
      enabled: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const feedsPath = path.join(
    __dirname,
    "../ingestion-service/data/feeds.json",
  );

  // Format exactly like the original array
  fs.writeFileSync(feedsPath, JSON.stringify(feeds, null, 2), "utf8");

  console.log(
    `✅ Successfully exported ${feeds.length} feeds to ingestion-service/data/feeds.json!`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Export failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
