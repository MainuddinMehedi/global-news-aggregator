import StoryDetailsSkeleton from "@/components/skeletons/stories/StoryDetailsSkeleton";
import { StoryDetailView } from "@/components/stories/StoryDetailView";
import { getStoryDetail } from "@/queries/stories";
import { getPublisherRegion } from "@/utils/analytics";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface StoryPageProps {
  params: Promise<{ slug: string }>;
}

export default function StoryDetailsPage({ params }: StoryPageProps) {
  return (
    <Suspense fallback={<StoryDetailsSkeleton />}>
      <StoryDetailsContent params={params} />
    </Suspense>
  );
}

async function StoryDetailsContent({ params }: StoryPageProps) {
  const resolvedParams = await params;
  const story = await getStoryDetail(resolvedParams.slug);

  if (!story) {
    notFound();
  }

  const uniqueSourcesMap = new Map<string, string>();
  story.articles.forEach((art) => {
    if (art.rawArticle.source && !uniqueSourcesMap.has(art.rawArticle.source)) {
      uniqueSourcesMap.set(art.rawArticle.source, art.rawArticle.url);
    }
  });

  const sources = Array.from(uniqueSourcesMap.entries()).map(([name, url]) => ({
    name,
    url,
  }));

  const uniqueOrigins = Array.from(
    new Set(
      story.articles
        .map((a) => getPublisherRegion(a.rawArticle.sourceCountry))
        .filter((o): o is string => !!o),
    ),
  );

  return (
    <StoryDetailView
      story={story}
      sources={sources}
      origins={uniqueOrigins}
      slug={resolvedParams.slug}
    />
  );
}
