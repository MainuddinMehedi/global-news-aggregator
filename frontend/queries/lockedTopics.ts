import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { LockedTopic } from "@/types/lockedTopic";

export async function getLockedTopics(
  search?: string,
): Promise<LockedTopic[]> {
  "use cache";
  cacheTag("locked-topics");
  cacheLife("minutes");

  const words = search?.trim().split(/\s+/).filter(Boolean) ?? [];
  const searchFilter =
    words.length > 0
      ? {
          AND: words.map((word) => ({
            OR: [
              { displayName: { contains: word, mode: "insensitive" as const } },
              { userContext: { contains: word, mode: "insensitive" as const } },
              {
                aiQuerySummary: {
                  contains: word,
                  mode: "insensitive" as const,
                },
              },
            ],
          })),
        }
      : {};

  try {
    const topics = await prisma.lockedTopic.findMany({
      where: searchFilter,
      orderBy: { createdAt: "desc" },
    });

    return topics as unknown as LockedTopic[];
  } catch (error) {
    console.error("getLockedTopics error:", error);
    throw new Error("Failed to fetch locked topics from the database");
  }
}

export async function getLockedTopicById(
  id: string,
): Promise<LockedTopic | null> {
  "use cache";
  cacheTag(`locked-topic-${id}`);
  cacheTag("locked-topics");
  cacheLife("minutes");

  try {
    const topic = await prisma.lockedTopic.findUnique({
      where: { id },
    });

    if (!topic) return null;

    return topic as unknown as LockedTopic;
  } catch (error) {
    console.error("getLockedTopicById error:", error);
    throw new Error("Failed to fetch locked topic from the database");
  }
}

export async function getTotalMatchCount(): Promise<number> {
  "use cache";
  cacheTag("locked-topics");
  cacheLife("minutes");

  try {
    const result = await prisma.lockedTopic.aggregate({
      _sum: {
        matchCount: true,
      },
    });

    return result._sum.matchCount || 0;
  } catch (error) {
    console.error("getTotalMatchCount error:", error);
    return 0;
  }
}

export async function getLockedTopicCount(): Promise<number> {
  "use cache";
  cacheTag("locked-topics");
  cacheLife("minutes");

  try {
    const count = await prisma.lockedTopic.count();
    return count;
  } catch (error) {
    console.error("getLockedTopicCount error:", error);
    return 0;
  }
}

export async function getUnreadFindingCount(topicId: string): Promise<number> {
  "use cache";
  cacheTag(`locked-topic-${topicId}-findings`);
  cacheLife("minutes");

  try {
    const count = await prisma.topicFinding.count({
      where: {
        topicId,
        isRead: false,
      },
    });
    return count;
  } catch (error) {
    console.error("getUnreadFindingCount error:", error);
    return 0;
  }
}
