import {
  getLockedTopicById,
  getUnreadFindingCount,
} from "@/queries/lockedTopics";
import { getFindings } from "@/queries/topicFindings";
import { notFound } from "next/navigation";
import TopicHeader from "@/components/locked-topics/TopicHeader";
import FindingsFilter from "@/components/locked-topics/FindingsFilter";
import FindingsList from "@/components/locked-topics/FindingsList";
import { FindingSource } from "@/types/lockedTopic";

interface TopicDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    source?: string;
    sort?: string;
  }>;
}

export default async function TopicDetailPage({
  params,
  searchParams,
}: TopicDetailPageProps) {
  const { id } = await params;
  const { source = "ALL", sort = "newest" } = await searchParams;

  const topic = await getLockedTopicById(id);
  if (!topic) notFound();

  const unreadCount = await getUnreadFindingCount(id);

  const { findings, nextCursor } = await getFindings({
    topicId: id,
    sourceType: source as FindingSource | "ALL",
    sort: sort as any,
    limit: 20,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      <TopicHeader topic={topic} unreadCount={unreadCount} />

      <div className="space-y-8">
        <FindingsFilter currentSource={source} currentSort={sort} />

        <FindingsList
          initialFindings={findings}
          initialNextCursor={nextCursor}
          topicId={id}
          sourceType={source as FindingSource | "ALL"}
          sort={sort as any}
        />
      </div>
    </div>
  );
}
