import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { TopicFinding, FindingSource } from "@/types/lockedTopic";

interface getFindingsParams {
  topicId: string;
  sourceType?: FindingSource | "ALL" | "OTHER";
  sort?: "newest" | "oldest" | "relevance";
  cursor?: string;
  limit?: number;
  unreadOnly?: boolean;
}

const DEFAULT_LIMIT = 20;

export async function getFindings({
  topicId,
  sourceType = "ALL",
  sort = "newest",
  cursor,
  limit = DEFAULT_LIMIT,
  unreadOnly = false,
}: getFindingsParams): Promise<{
  findings: TopicFinding[];
  nextCursor: string | null;
}> {
  "use cache";
  cacheTag(`topic-findings-${topicId}`);
  if (unreadOnly) cacheTag(`topic-unread-findings-${topicId}`);
  cacheLife("minutes");

  const where: {
    topicId: string;
    sourceType?: FindingSource | { notIn: FindingSource[] };
    isRead?: boolean;
  } = { topicId };

  if (sourceType === "OTHER") {
    where.sourceType = { notIn: ["ARTICLE", "GOOGLE", "BRAVE", "REDDIT"] };
  } else if (sourceType !== "ALL") {
    where.sourceType = sourceType as FindingSource;
  }

  if (unreadOnly) {
    where.isRead = false;
  }

  let orderBy:
    | { foundAt: "desc" | "asc" }
    | Array<{ relevanceScore: "desc" | "asc" } | { foundAt: "desc" | "asc" }> =
    {
      foundAt: "desc",
    };

  if (sort === "oldest") {
    orderBy = { foundAt: "asc" };
  } else if (sort === "relevance") {
    orderBy = [{ relevanceScore: "desc" }, { foundAt: "desc" }];
  }

  try {
    const raw = await prisma.topicFinding.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      where,
      orderBy,
    });

    const hasMore = raw.length > limit;
    const findings = hasMore ? raw.slice(0, limit) : raw;
    const nextCursor = hasMore ? findings[findings.length - 1].id : null;

    return {
      findings: findings as unknown as TopicFinding[],
      nextCursor,
    };
  } catch (error) {
    console.error("getFindings error:", error);
    return {
      findings: [],
      nextCursor: null,
    };
  }
}

// Helper for initial server-side load
export async function getInitialFindings(topicId: string) {
  return getFindings({ topicId });
}

export async function getFindingCounts(topicId: string): Promise<Record<string, number>> {
  "use cache";
  cacheTag(`topic-findings-${topicId}`);
  cacheLife("minutes");

  try {
    const groups = await prisma.topicFinding.groupBy({
      by: ["sourceType"],
      where: { topicId },
      _count: {
        _all: true,
      },
    });

    const counts: Record<string, number> = {};
    let total = 0;
    let otherCount = 0;

    for (const group of groups) {
      const type = group.sourceType;
      const count = group._count._all;
      counts[type] = count;
      total += count;

      if (type !== "ARTICLE" && type !== "GOOGLE" && type !== "BRAVE" && type !== "REDDIT") {
        otherCount += count;
      }
    }

    counts["ALL"] = total;
    counts["OTHER"] = otherCount;

    return counts;
  } catch (error) {
    console.error("getFindingCounts error:", error);
    return {
      ALL: 0,
      OTHER: 0,
    };
  }
}

