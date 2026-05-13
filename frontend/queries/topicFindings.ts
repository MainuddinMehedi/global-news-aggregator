import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { TopicFinding, FindingSource } from "@/types/lockedTopic";

interface getFindingsParams {
  topicId: string;
  sourceType?: FindingSource | "ALL";
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

  const where: any = { topicId };

  if (sourceType !== "ALL") {
    where.sourceType = sourceType;
  }

  if (unreadOnly) {
    where.isRead = false;
  }

  let orderBy: any = { foundAt: "desc" };

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
    throw new Error("Failed to fetch findings from the database");
  }
}

// Helper for initial server-side load
export async function getInitialFindings(topicId: string) {
  return getFindings({ topicId });
}
