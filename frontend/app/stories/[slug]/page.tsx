import StoryDetailsSkeleton from "@/components/skeletons/stories/StoryDetailsSkeleton";
import { StoryDetailView } from "@/components/stories/StoryDetailView";
import { getStoryDetail } from "@/queries/stories";
import { getPublisherRegion } from "@/utils/regions";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface StoryPageProps {
  params: Promise<{ slug: string }>;
}

export default function StoryDetailsPage({ params }: StoryPageProps) {
  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Static Back Button (Instant Render) */}
      <Link
        href="/stories"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="mr-2 h-4 w-4" />
        Back to Stories
      </Link>

      {/* Dynamic Content Boundary */}
      <Suspense fallback={<StoryDetailsSkeleton />}>
        <StoryDetailsContent params={params} />
      </Suspense>
    </div>
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
