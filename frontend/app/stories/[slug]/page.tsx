import { notFound } from "next/navigation";
import { getStoryDetail } from "@/queries/stories";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import ArticleCard from "@/components/articles/ArticleCard";
import { Article } from "@/types/article";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { StoryHero, KeyDevelopmentsTimeline } from "@/components/stories";

export default async function StoryDetailsPage({
  params,
}: {
  params: { slug: string };
}) {
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
    biasCategory: processedArticle.biasCategory,
    sentimentScore: processedArticle.sentimentScore,
    perspectiveCountries: processedArticle.perspectiveCountries,
    url: processedArticle.rawArticle.url,
    categories: processedArticle.categories,
    entities: processedArticle.entities,
    sourceCountry: processedArticle.rawArticle.sourceCountry,
    slug: processedArticle.rawArticle.slug,
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <Link
        href="/stories"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="mr-2 h-4 w-4" />
        Back to Stories
      </Link>

      <StoryHero story={story} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="rounded-[2rem] border border-border bg-card/40 backdrop-blur-xl p-8 shadow-sm space-y-8">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                AI Summary
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
                </h2>
                <p className="text-base font-medium leading-relaxed text-foreground">
                  {story.whyItMatters}
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-tight">
                Multi-Source Perspectives
              </h2>
              <Badge variant="outline">{story.articles.length} Reports</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {story.articles.map((processedArticle) => {
                const mappedArticle =
                  mapStoryArticleToArticle(processedArticle);

                return (
                  <ArticleCard
                    key={processedArticle.id}
                    article={mappedArticle}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="rounded-[2rem] border border-border bg-card/40 backdrop-blur-xl p-6 shadow-sm sticky top-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
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
