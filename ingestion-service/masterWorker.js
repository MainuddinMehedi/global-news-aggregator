import { startBoss } from "./lib/boss.js";
import { runIngestionPipeline } from "./runIngest.js";
import { runClusteringLogic } from "./runClustering.js";
import { processBacklogLogic } from "./processBacklog.js";
import { scanTopicsLogic } from "./scanTopics.js";

async function runMasterWorker() {
  const boss = await startBoss();

  console.log("🚀 [Master Worker] Started, initializing schedules and queues...");

  // --- 1. Set Up Queues ---
  // pg-boss requires explicitly creating queues
  await boss.createQueue("ingest-queue");
  await boss.createQueue("cluster-queue");
  await boss.createQueue("backlog-queue");
  await boss.createQueue("topics-queue");

  // --- 2. Set Up Schedules (CRON) ---
  // These replace the old GitHub Actions
  await boss.schedule("ingest-queue", "*/30 * * * *");
  await boss.schedule("cluster-queue", "45 * * * *");
  await boss.schedule("backlog-queue", "0 3 * * *");
  await boss.schedule("topics-queue", "15 */2 * * *");
  
  console.log("🕒 [Master Worker] Cron schedules active in pg-boss.");

  // --- 3. Register Work Handlers ---

  // Ingest handler
  await boss.work("ingest-queue", { concurrency: 1, batchSize: 1 }, async (jobs) => {
    const jobArray = Array.isArray(jobs) ? jobs : [jobs];
    for (const job of jobArray) {
      console.log(`\n[Worker] ⚡ Starting ingest-queue job ${job.id}`);
      try {
        await runIngestionPipeline();
        console.log(`[Worker] ✅ ingest-queue job ${job.id} completed.`);
      } catch (err) {
        console.error(`[Worker] ❌ ingest-queue job ${job.id} failed:`, err);
        throw err;
      }
    }
  });

  // Cluster handler
  await boss.work("cluster-queue", { concurrency: 1, batchSize: 1 }, async (jobs) => {
    const jobArray = Array.isArray(jobs) ? jobs : [jobs];
    for (const job of jobArray) {
      console.log(`\n[Worker] ⚡ Starting cluster-queue job ${job.id}`);
      try {
        await runClusteringLogic();
        console.log(`[Worker] ✅ cluster-queue job ${job.id} completed.`);
      } catch (err) {
        console.error(`[Worker] ❌ cluster-queue job ${job.id} failed:`, err);
        throw err;
      }
    }
  });

  // Backlog handler
  await boss.work("backlog-queue", { concurrency: 1, batchSize: 1 }, async (jobs) => {
    const jobArray = Array.isArray(jobs) ? jobs : [jobs];
    for (const job of jobArray) {
      console.log(`\n[Worker] ⚡ Starting backlog-queue job ${job.id}`);
      try {
        await processBacklogLogic();
        console.log(`[Worker] ✅ backlog-queue job ${job.id} completed.`);
      } catch (err) {
        console.error(`[Worker] ❌ backlog-queue job ${job.id} failed:`, err);
        throw err;
      }
    }
  });

  // Locked Topics handler (supports specific topicId via UI or null via cron)
  await boss.work("topics-queue", { concurrency: 4, batchSize: 1 }, async (jobs) => {
    const jobArray = Array.isArray(jobs) ? jobs : [jobs];
    for (const job of jobArray) {
      console.log(`\n[Worker] ⚡ Processing topics-queue job ${job.id} for topic ${job.data?.topicId || "ALL"}`);
      try {
        const count = await scanTopicsLogic(job.data?.topicId);
        console.log(`[Worker] ✅ topics-queue job ${job.id} completed. Found ${count} findings.`);
      } catch (err) {
        console.error(`[Worker] ❌ topics-queue job ${job.id} failed:`, err);
        throw err; // Let pg-boss retry it
      }
    }
  });

  console.log("🎧 [Master Worker] Listening for jobs across all queues...");
}

runMasterWorker().catch((err) => {
  console.error("❌ [Master Worker] Fatal error:", err);
  process.exit(1);
});
