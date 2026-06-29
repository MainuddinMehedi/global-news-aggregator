import { prisma } from "../db/prisma.js";
import { emitAdminNotification } from "../notifications/index.js";

/**
 * Clean up tasks that have lost their heartbeat.
 * Sets RUNNING tasks with heartbeat older than 10 minutes to FAILED.
 */
async function autoFailStaleTasks() {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const result = await prisma.systemTask.updateMany({
      where: {
        status: "RUNNING",
        heartbeatAt: { lt: tenMinutesAgo },
      },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorMessage: "Process likely terminated abnormally (Heartbeat lost for over 10 minutes).",
      },
    });
    if (result.count > 0) {
      console.log(`🧹 SystemTask Auto-Fail: Marked ${result.count} stale tasks as FAILED.`);
    }
  } catch (err) {
    console.error("⚠️ Failed to auto-fail stale tasks:", err.message);
  }
}

/**
 * Creates a SystemTask record when a worker starts.
 * @param {string} taskName 
 * @returns {Promise<string|null>} The taskId
 */
export async function startTaskLogging(taskName) {
  // Clean up any stale tasks first
  await autoFailStaleTasks();

  try {
    const task = await prisma.systemTask.create({
      data: {
        taskName,
        status: "RUNNING",
        startedAt: new Date(),
        heartbeatAt: new Date(),
      },
    });
    console.log(`📊 [Telemetry] Started task: ${taskName} (ID: ${task.id})`);
    return task.id;
  } catch (err) {
    console.error(`⚠️ Failed to create SystemTask for ${taskName}:`, err.message);
    return null;
  }
}

/**
 * Updates the heartbeat timestamp of a running task.
 * @param {string} taskId 
 */
export async function updateTaskHeartbeat(taskId) {
  if (!taskId) return;
  try {
    await prisma.systemTask.update({
      where: { id: taskId },
      data: { heartbeatAt: new Date() },
    });
  } catch (err) {
    console.error(`⚠️ Failed to update SystemTask heartbeat for task ${taskId}:`, err.message);
  }
}

/**
 * Completes a running task, setting final status, metadata, and error details.
 * @param {string} taskId 
 * @param {"SUCCESS"|"FAILED"} status 
 * @param {object|null} metadata 
 * @param {string|null} errorMessage 
 */
export async function completeTaskLogging(taskId, status, metadata = null, errorMessage = null) {
  if (!taskId) return;
  try {
    const updatedTask = await prisma.systemTask.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: new Date(),
        errorMessage: errorMessage || null,
        metadata: metadata || undefined,
      },
    });
    console.log(`📊 [Telemetry] Completed task ${taskId} with status: ${status}`);

    if (status === "FAILED") {
      await emitAdminNotification("PIPELINE_FAILURE", {
        taskName: updatedTask.taskName,
        errorMessage,
        metadata
      });
    }
  } catch (err) {
    console.error(`⚠️ Failed to complete SystemTask logging for task ${taskId}:`, err.message);
  }
}
