import { cleanupAnonymousChats } from "./cleanup/guestSessionsCleanup.js";
import { cleanupNotifications } from "./cleanup/notificationRetention.js";
import { runHealthMonitor } from "./health/monitor.js";
import { startBoss } from "./lib/boss.js";
import { processDeliveryBatch } from "./notifications/deliveryWorker.js";
import { processNotificationDigests } from "./notifications/digestWorker.js";
import { processBacklogLogic } from "./processBacklog.js";
import { runClusteringLogic } from "./runClustering.js";
import { runIngestionPipeline } from "./runIngest.js";
import { scanTopicsLogic } from "./scanTopics.js";

/**
 * Factors out the queue creation, scheduling, array checking, and try/catch error handling boilerplate for pg-boss.
 */
async function registerWorker(boss, queueName, cronSchedule, handler, options = {}) {
  // 1. Set Up Queue
  await boss.createQueue(queueName);

  // 2. Set Up Schedule
  await boss.schedule(queueName, cronSchedule);

  // 3. Register Handler
  await boss.work(queueName, { concurrency: 1, batchSize: 1, ...options }, async (jobs) => {
    const jobArray = Array.isArray(jobs) ? jobs : [jobs];
    for (const job of jobArray) {
      console.log(`\n[Worker] ⚡ Starting ${queueName} job ${job.id}`);
      try {
        await handler(job);
        console.log(`[Worker] ✅ ${queueName} job ${job.id} completed.`);
      } catch (err) {
        console.error(`[Worker] ❌ ${queueName} job ${job.id} failed:`, err);
        throw err; // Let pg-boss retry
      }
    }
  });
}

async function runMasterWorker() {
  const boss = await startBoss();

  console.log("🚀 [Master Worker] Started, initializing schedules and queues...");

  // Factor out worker definitions using registerWorker utility
  await registerWorker(boss, "ingest-queue", "*/30 * * * *", () => runIngestionPipeline());
  await registerWorker(boss, "cluster-queue", "45 * * * *", () => runClusteringLogic());
  await registerWorker(boss, "backlog-queue", "0 3 * * *", () => processBacklogLogic());
  await registerWorker(boss, "topics-queue", "15 */2 * * *", (job) => scanTopicsLogic(job.data?.topicId), { concurrency: 4 });
  await registerWorker(boss, "notification-delivery", "* * * * *", () => processDeliveryBatch());
  await registerWorker(boss, "notification-digest", "0 8 * * *", () => processNotificationDigests()); // Runs every day at 8:00 AM
  await registerWorker(boss, "health-monitor", "*/15 * * * *", () => runHealthMonitor());
  await registerWorker(boss, "notification-retention", "0 4 * * *", () => cleanupNotifications());
  await registerWorker(boss, "anonymous-chat-cleanup", "0 4 * * *", () => cleanupAnonymousChats());

  console.log("🕒 [Master Worker] Cron schedules active in pg-boss.");
  console.log("🎧 [Master Worker] Listening for jobs across all queues...");
}

runMasterWorker().catch((err) => {
  console.error("❌ [Master Worker] Fatal error:", err);
  process.exit(1);
});
