import { startBoss } from "./lib/boss.js";
import { scanTopicsLogic } from "./scanTopics.js";

async function runWorker() {
  const boss = await startBoss();
  const QUEUE_NAME = "scan-queue";

  console.log("🚀 [Worker] Started, listening for jobs...");

  // Register the worker with CONCURRENCY control
  // Max 4 simultaneous jobs to prevent OOM
  await boss.work(
    QUEUE_NAME,
    {
      concurrency: 4,
      batchSize: 1,
    },
    async (jobs) => {
      // In pg-boss v9, jobs is an array even if batchSize is 1
      const jobArray = Array.isArray(jobs) ? jobs : [jobs];
      
      for (const job of jobArray) {
        console.log(`[Worker] Processing job ${job.id} for topic ${job.data?.topicId || "ALL"}`);
        try {
          const count = await scanTopicsLogic(job.data?.topicId);
          console.log(`[Worker] Job ${job.id} completed. Found ${count} findings.`);
          return count;
        } catch (err) {
          console.error(`[Worker] Job ${job.id} failed:`, err);
          throw err;
        }
      }
    }
  );
}

runWorker().catch((err) => {
  console.error("❌ [Worker] Fatal error:", err);
  process.exit(1);
});
