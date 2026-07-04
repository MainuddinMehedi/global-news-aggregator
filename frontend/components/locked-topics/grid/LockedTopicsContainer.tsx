import LockedTopicGrid from "@/components/locked-topics/grid/LockedTopicGrid";
import { getLockedTopics, getUnreadFindingCount } from "@/queries/lockedTopics";
import { getInitialFindings } from "@/queries/topicFindings";
import { TopicFinding } from "@/types/lockedTopic";

interface LockedTopicsContainerProps {
  userId: string | undefined;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function LockedTopicsContainer({
  userId,
  searchParams,
}: LockedTopicsContainerProps) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const topics = userId
    ? await getLockedTopics(userId, search || undefined)
    : [];

  // Fetch latest 3 findings and unread count for each topic to show on the card
  const latestFindingsMap: Record<string, TopicFinding[]> = {};
  const unreadCountsMap: Record<string, number> = {};

  if (userId) {
    await Promise.all(
      topics.map(async (topic) => {
        const [{ findings }, unreadCount] = await Promise.all([
          getInitialFindings(topic.id),
          getUnreadFindingCount(topic.id, userId),
        ]);
        latestFindingsMap[topic.id] = findings.slice(0, 3);
        unreadCountsMap[topic.id] = unreadCount;
      }),
    );
  }

  return (
    <LockedTopicGrid
      topics={topics}
      latestFindingsMap={latestFindingsMap}
      unreadCountsMap={unreadCountsMap}
      isAuthenticated={!!userId}
    />
  );
}
