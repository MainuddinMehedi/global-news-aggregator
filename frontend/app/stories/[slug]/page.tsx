import { notFound } from "next/navigation";
import { getStoryDetail } from "@/queries/stories";
import { getPublisherRegion } from "@/lib/utils";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import {
  StoryHero,
  PerspectiveWidget,
  StoryAnalysis,
  StoryTimelineSidebar,
  StoryArticlesGrid,
} from "@/components/stories";
import { mapProcessedArticleToArticle } from "@/lib/article";

import { Suspense } from "react";
import StoryDetailsSkeleton from "@/components/stories/grid/StorySkeleton";

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
        .filter((o): o is string => !!o)
    )
  );

  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <Link
        href="/stories"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="mr-2 h-4 w-4" />
        Back to Stories
      </Link>

      <StoryHero story={story} sources={sources} origins={uniqueOrigins} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Row 1, Left: AI Analysis Summary */}
        <StoryAnalysis
          summary={story.summary}
          whyItMatters={story.whyItMatters}
        />

        {/* Row 1-3, Right: Timeline of Developments (Sticky Sidebar on Desktop) */}
        <StoryTimelineSidebar developments={story.keyDevelopments || []} />

        {/* Row 2, Left: PerspectiveWidget */}
        <div className="lg:col-span-8 order-3">
          <PerspectiveWidget articles={story.articles.map(mapProcessedArticleToArticle)} />
        </div>

        {/* Row 3, Left: Multi-Source Perspectives Articles Listing */}
        <StoryArticlesGrid articles={story.articles} slug={resolvedParams.slug} />
      </div>
    </div>
  );
}
