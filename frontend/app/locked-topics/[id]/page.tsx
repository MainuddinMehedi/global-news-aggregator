import {
  getLockedTopicById,
} from "@/queries/lockedTopics";
import { getFindings, getFindingCounts } from "@/queries/topicFindings";
import { notFound } from "next/navigation";
import TopicHeader from "@/components/locked-topics/TopicHeader";
import FindingsFilter from "@/components/locked-topics/FindingsFilter";
import FindingsList from "@/components/locked-topics/FindingsList";
import { MarkAsRead } from "@/components/locked-topics/MarkAsRead";
import { FindingSource } from "@/types/lockedTopic";

import { Suspense } from "react";
import TopicDetailLoading from "./loading";

interface TopicDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    source?: string;
    sort?: string;
  }>;
}

export default function TopicDetailPage({ params, searchParams }: TopicDetailPageProps) {
  return (
    <Suspense fallback={<TopicDetailLoading />}>
      <TopicDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function TopicDetailContent({
  params,
  searchParams,
}: TopicDetailPageProps) {
  const { id } = await params;
  const { source = "ALL", sort = "newest" } = await searchParams;

  const topic = await getLockedTopicById(id);
  if (!topic) notFound();

  const counts = await getFindingCounts(id);

  const { findings, nextCursor } = await getFindings({
    topicId: id,
    sourceType: source as FindingSource | "ALL" | "OTHER",
    sort: sort as "newest" | "oldest" | "relevance",
    limit: 20,
  });

  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <MarkAsRead topicId={id} />
      <TopicHeader topic={topic} />

      <div className="space-y-8">
        <FindingsFilter
          currentSource={source}
          currentSort={sort}
          sources={topic.sources}
          counts={counts}
        />

        <FindingsList
          initialFindings={findings}
          initialNextCursor={nextCursor}
          topicId={id}
          sourceType={source as FindingSource | "ALL"}
          sort={sort as "newest" | "oldest" | "relevance"}
        />
      </div>
    </div>
  );
}
