import prisma from "@/lib/prisma";
import { getStartDate } from "@/utils/analytics";
import { cacheLife, cacheTag } from "next/cache";

export interface UserAnalyticsData {
  totalFindings: number;
  totalTopics: number;
  topicSourceDistribution: {
    source: string;
    count: number;
    percentage: number;
  }[];
}

export async function getUserAnalyticsData(
  userId: string,
  timeRange: string = "7d",
): Promise<UserAnalyticsData> {
  "use cache";
  cacheTag(`analytics-user-${userId}-${timeRange}`);
  cacheTag(`locked-topics`); // Ideally, we'd tag by user id, but using broad tags for now
  cacheLife("minutes");

  const startDate = getStartDate(timeRange);

  try {
    const [topicFindings, lockedTopics, topicSources] = await Promise.all([
      prisma.topicFinding.count({
        where: {
          foundAt: { gte: startDate },
          topic: { userId: userId },
        },
      }),
      prisma.lockedTopic.count({
        where: {
          createdAt: { gte: startDate },
          userId: userId,
        },
      }),
      prisma.topicFinding.groupBy({
        by: ["sourceType"],
        _count: { _all: true },
        where: {
          foundAt: { gte: startDate },
          topic: { userId: userId },
        },
      }),
    ]);

    // ── Topic Source Distribution ─────────────────────────────────────────────
    const totalTopicSources = topicSources.reduce(
      (s, t) => s + t._count._all,
      0,
    );

    const topicSourceDistribution = topicSources
      .map((t) => ({
        source: t.sourceType,
        count: t._count._all,
        percentage:
          totalTopicSources > 0
            ? Math.round((t._count._all / totalTopicSources) * 100)
            : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalFindings: topicFindings,
      totalTopics: lockedTopics,
      topicSourceDistribution,
    };
  } catch (error) {
    console.error("getUserAnalyticsData error:", error);

    return {
      totalFindings: 0,
      totalTopics: 0,
      topicSourceDistribution: [],
    };
  }
}
