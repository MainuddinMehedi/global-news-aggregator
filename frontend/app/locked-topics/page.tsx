import { getLockedTopics, getUnreadFindingCount } from "@/queries/lockedTopics";
import { getInitialFindings } from "@/queries/topicFindings";
import LockedTopicGrid from "@/components/locked-topics/LockedTopicGrid";
import { HugeiconsIcon } from "@hugeicons/react";
import { RssLockedIcon } from "@hugeicons/core-free-icons";
import CreateTopicModal from "@/components/locked-topics/CreateTopicModal";
import { TopicFinding } from "@/types/lockedTopic";

export default async function LockedTopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const topics = await getLockedTopics(search || undefined);

  // Fetch latest 3 findings and unread count for each topic to show on the card
  // This is efficient because getInitialFindings and getUnreadFindingCount are cached
  const latestFindingsMap: Record<string, TopicFinding[]> = {};
  const unreadCountsMap: Record<string, number> = {};

  await Promise.all(
    topics.map(async (topic) => {
      const [{ findings }, unreadCount] = await Promise.all([
        getInitialFindings(topic.id),
        getUnreadFindingCount(topic.id),
      ]);
      console.log(
        `[LockedTopicsPage] Topic: ${topic.displayName}, Findings: ${findings.length}, Unread: ${unreadCount}`,
      );
      latestFindingsMap[topic.id] = findings.slice(0, 3);
      unreadCountsMap[topic.id] = unreadCount;
    }),
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest shadow-sm">
            <HugeiconsIcon icon={RssLockedIcon} size={14} />
            Active Surveillance
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Locked <span className="text-primary">Topics</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-snug tracking-wide">
              Pin specific themes to ensure they are persistently tracked. The
              system acts as your personal researcher, monitoring all sources
              every 2 hours.
            </p>
          </div>
        </div>

        <CreateTopicModal />
      </div>

      <LockedTopicGrid
        topics={topics}
        latestFindingsMap={latestFindingsMap}
        unreadCountsMap={unreadCountsMap}
      />
    </div>
  );
}
