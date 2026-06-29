import { prisma } from "../db/prisma.js";
import { emitAdminNotification } from "../notifications/index.js";

/**
 * Runs periodic health checks on the system and emits admin notifications
 * if degradation is detected.
 */
export async function runHealthMonitor() {
  console.log(`🩺 [Health Monitor] Running system checks...`);
  try {
    await checkIngestionStalled();
    await checkHighFailureRates();
    await checkAiProviderDegradation();
    console.log(`🩺 [Health Monitor] Checks complete.`);
  } catch (err) {
    console.error(`🩺 [Health Monitor] Monitor run failed:`, err);
  }
}

async function checkIngestionStalled() {
  const twoAndHalfHoursAgo = new Date(Date.now() - 2.5 * 60 * 60 * 1000);
  
  const lastSuccess = await prisma.systemTask.findFirst({
    where: {
      taskName: 'rss-ingestion',
      status: 'SUCCESS'
    },
    orderBy: { completedAt: 'desc' }
  });

  if (!lastSuccess || (lastSuccess.completedAt && lastSuccess.completedAt < twoAndHalfHoursAgo)) {
    const hours = lastSuccess 
      ? ((Date.now() - lastSuccess.completedAt.getTime()) / (1000 * 60 * 60)).toFixed(1)
      : 'Unknown';
      
    await emitAdminNotification('INGESTION_STALLED', {
      lastSuccessDate: lastSuccess ? lastSuccess.completedAt.toISOString() : null,
      hoursSinceLastSuccess: hours
    });
  }
}

async function checkHighFailureRates() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const failures = await prisma.systemTask.groupBy({
    by: ['taskName'],
    where: {
      status: 'FAILED',
      completedAt: { gte: oneDayAgo }
    },
    _count: {
      id: true
    }
  });

  for (const failure of failures) {
    if (failure._count.id >= 3) {
      await emitAdminNotification('HIGH_FAILURE_RATE', {
        taskName: failure.taskName,
        failureCount: failure._count.id,
        timeWindowHours: 24
      });
    }
  }
}

async function checkAiProviderDegradation() {
  // Check error rate > 30% (min 10 calls) in last 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const usageStats = await prisma.aiUsage.groupBy({
    by: ['provider', 'success'],
    where: {
      createdAt: { gte: oneHourAgo }
    },
    _count: {
      id: true
    }
  });

  // Group by provider
  const providerStats = {};
  for (const stat of usageStats) {
    const p = stat.provider;
    if (!providerStats[p]) providerStats[p] = { success: 0, fail: 0 };
    if (stat.success) providerStats[p].success += stat._count.id;
    else providerStats[p].fail += stat._count.id;
  }

  for (const [provider, counts] of Object.entries(providerStats)) {
    const total = counts.success + counts.fail;
    if (total >= 10) {
      const errorRate = counts.fail / total;
      if (errorRate > 0.3) {
        await emitAdminNotification('AI_PROVIDER_DEGRADED', {
          provider,
          errorRate,
          totalCalls: total,
          timeWindowHours: 1
        });
      }
    }
  }
}
