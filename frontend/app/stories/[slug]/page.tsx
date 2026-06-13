import { notFound } from "next/navigation";
import { getStoryDetail } from "@/queries/stories";
import { getEventRegionBadgeVariant } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import ArticleCard from "@/components/articles/ArticleCard";
import { Article } from "@/types/article";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { StoryHero, KeyDevelopmentsTimeline, PerspectiveWidget } from "@/components/stories";

import { Suspense } from "react";
import FeedSkeleton from "@/components/Feed/FeedSkeleton";

interface StoryPageProps {
  params: Promise<{ slug: string }>;
}

export default function StoryDetailsPage({ params }: StoryPageProps) {
  return (
    <Suspense fallback={<FeedSkeleton />}>
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

  type StoryArticle = (typeof story.articles)[number];

  const mapStoryArticleToArticle = (
    processedArticle: StoryArticle,
  ): Article => ({
    id: processedArticle.id,
    title: processedArticle.rawArticle.title,
    source: processedArticle.rawArticle.source,
    publishedAt: processedArticle.rawArticle.publishedAt.toISOString(),
    contentSnippet: processedArticle.rawArticle.contentSnippet,
    extractedContent: processedArticle.rawArticle.extractedContent,
    biasNote: processedArticle.biasNote,
    sentimentScore: processedArticle.sentimentScore,
    perspectiveCountries: processedArticle.perspectiveCountries,
    url: processedArticle.rawArticle.url,
    categories: processedArticle.categories,
    entities: processedArticle.entities,
    sourceCountry: processedArticle.rawArticle.sourceCountry,
    slug: processedArticle.rawArticle.slug,
    eventRegion: processedArticle.eventRegion,
    sourceOrigin: processedArticle.rawArticle.sourceOrigin,
    sourceType: processedArticle.rawArticle.sourceType,
    biasGroup: processedArticle.rawArticle.biasGroup,
    coverageScope: processedArticle.rawArticle.coverageScope,
  });

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
        .map((a) => a.rawArticle.sourceOrigin)
        .filter((o): o is string => !!o)
    )
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <Link
        href="/stories"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="mr-2 h-4 w-4" />
        Back to Stories
      </Link>

      <StoryHero story={story} sources={sources} origins={uniqueOrigins} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="rounded-[2.5rem] border border-border bg-card/40 backdrop-blur-xl p-6 md:p-8 shadow-sm space-y-8">
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-5 flex items-center gap-2">
                <span className="w-8 h-px bg-border" />
                AI Analysis Summary
              </h2>
              <p className="text-base leading-relaxed text-foreground/90">
                {story.summary}
              </p>
            </div>

            {story.whyItMatters && (
              <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                  <HugeiconsIcon icon={Alert01Icon} className="h-4 w-4" />
                  Why It Matters
                  {/*Strategic Significance*/}
                </h2>
                <p className="text-base font-medium leading-relaxed text-foreground">
                  {story.whyItMatters}
                </p>
              </div>
            )}
          </div>

          <PerspectiveWidget articles={story.articles.map(mapStoryArticleToArticle)} />

          <div>
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-2xl font-extrabold tracking-tight">
                Multi-Source <span className="text-primary">Perspectives</span>
              </h2>
              <Badge
                variant="outline"
                className="rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest"
              >
                {story.articles.length} Reports
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {story.articles.map((processedArticle) => {
                const mappedArticle =
                  mapStoryArticleToArticle(processedArticle);

                return (
                  <ArticleCard
                    key={processedArticle.id}
                    article={mappedArticle}
                    storySlug={resolvedParams.slug}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="rounded-[2.5rem] border border-border bg-card/40 backdrop-blur-xl p-8 shadow-sm sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-hide">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-8 flex items-center gap-2">
              <span className="w-4 h-px bg-border" />
              Timeline of Developments
            </h3>
            <KeyDevelopmentsTimeline
              developments={story.keyDevelopments || []}
              showTitle={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
