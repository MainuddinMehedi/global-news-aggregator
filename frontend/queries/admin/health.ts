import prisma from "@/lib/prisma";

export interface SystemTaskData {
  id: string;
  taskName: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  heartbeatAt: Date;
  errorMessage: string | null;
  metadata: any;
}

export async function getRunningTasks(): Promise<SystemTaskData[]> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  try {
    const tasks = await prisma.systemTask.findMany({
      where: {
        status: "RUNNING",
        heartbeatAt: { gte: fiveMinutesAgo },
      },
      orderBy: { startedAt: "desc" },
    });
    return tasks as unknown as SystemTaskData[];
  } catch (error) {
    console.error("getRunningTasks error:", error);
    return [];
  }
}

export async function getTaskLogs(limit: number = 50): Promise<SystemTaskData[]> {
  try {
    const tasks = await prisma.systemTask.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
    });
    return tasks as unknown as SystemTaskData[];
  } catch (error) {
    console.error("getTaskLogs error:", error);
    return [];
  }
}

export interface SystemHealthOverview {
  activeWorkersCount: number;
  ingestionRatePerHour: number;
  dedupEfficiency: number;
  totalFailures24h: number;
  recentErrors: { taskName: string; errorMessage: string; startedAt: Date }[];
}

export async function getSystemHealthOverview(): Promise<SystemHealthOverview> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  try {
    // Stale task auto-fail right inside the query trigger (so we fail stale runs immediately when loaded)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    await prisma.systemTask.updateMany({
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

    const [
      activeTasksCount,
      failures24hCount,
      recentErrors,
      rawCount1h,
      processedCount1h,
      rawCount24h,
      processedCount24h
    ] = await Promise.all([
      // Active workers
      prisma.systemTask.count({
        where: {
          status: "RUNNING",
          heartbeatAt: { gte: fiveMinutesAgo },
        },
      }),
      // Failures in 24h
      prisma.systemTask.count({
        where: {
          status: "FAILED",
          completedAt: { gte: oneDayAgo },
        },
      }),
      // Recent errors list
      prisma.systemTask.findMany({
        where: {
          status: "FAILED",
          errorMessage: { not: null },
        },
        select: {
          taskName: true,
          errorMessage: true,
          startedAt: true,
        },
        orderBy: { startedAt: "desc" },
        take: 10,
      }),
      // Ingestion stats for rates
      prisma.rawArticle.count({
        where: { fetchedAt: { gte: oneHourAgo } },
      }),
      prisma.processedArticle.count({
        where: {
          processedAt: { gte: oneHourAgo },
          clusterStatus: { not: "SKIPPED" },
        },
      }),
      prisma.rawArticle.count({
        where: { fetchedAt: { gte: oneDayAgo } },
      }),
      prisma.processedArticle.count({
        where: {
          processedAt: { gte: oneDayAgo },
          clusterStatus: { not: "SKIPPED" },
        },
      }),
    ]);

    const dedupEfficiency = rawCount24h > 0 
      ? Math.round((1 - processedCount24h / rawCount24h) * 100) 
      : 0;

    return {
      activeWorkersCount: activeTasksCount,
      ingestionRatePerHour: processedCount1h,
      dedupEfficiency,
      totalFailures24h: failures24hCount,
      recentErrors: recentErrors.map(e => ({
        taskName: e.taskName,
        errorMessage: e.errorMessage || "Unknown error",
        startedAt: e.startedAt,
      })),
    };
  } catch (error) {
    console.error("getSystemHealthOverview error:", error);
    return {
      activeWorkersCount: 0,
      ingestionRatePerHour: 0,
      dedupEfficiency: 0,
      totalFailures24h: 0,
      recentErrors: [],
    };
  }
}

export interface IngestionVolumePoint {
  date: string;
  raw: number;
  processed: number;
  clustered: number;
}

export async function getIngestionVolumeChartData(daysToChart: number = 7): Promise<IngestionVolumePoint[]> {
  const chartStartDate = new Date(Date.now() - daysToChart * 24 * 60 * 60 * 1000);
  try {
    const [rawArticles, processedArticles, storyClusters] = await Promise.all([
      prisma.rawArticle.findMany({
        where: { fetchedAt: { gte: chartStartDate } },
        select: { fetchedAt: true },
      }),
      prisma.processedArticle.findMany({
        where: {
          processedAt: { gte: chartStartDate },
          clusterStatus: { not: "SKIPPED" },
        },
        select: { processedAt: true },
      }),
      prisma.storyCluster.findMany({
        where: { createdAt: { gte: chartStartDate } },
        select: { createdAt: true },
      }),
    ]);

    const volumeByDate: Record<string, { raw: number; processed: number; clustered: number }> = {};
    for (let i = daysToChart - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      volumeByDate[d] = { raw: 0, processed: 0, clustered: 0 };
    }

    rawArticles.forEach((a) => {
      const d = a.fetchedAt.toISOString().split("T")[0];
      if (volumeByDate[d]) volumeByDate[d].raw++;
    });
    processedArticles.forEach((a) => {
      const d = a.processedAt.toISOString().split("T")[0];
      if (volumeByDate[d]) volumeByDate[d].processed++;
    });
    storyClusters.forEach((c) => {
      const d = c.createdAt.toISOString().split("T")[0];
      if (volumeByDate[d]) volumeByDate[d].clustered++;
    });

    return Object.entries(volumeByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));
  } catch (error) {
    console.error("getIngestionVolumeChartData error:", error);
    return [];
  }
}
