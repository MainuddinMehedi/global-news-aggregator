import { notFound } from "next/navigation";
import { getStoryDetail } from "@/queries/stories";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import ArticleCard from "@/components/articles/ArticleCard";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  ArrowLeft01Icon,
  Clock01Icon,
  Earth,
  TradeUpIcon,
} from "@hugeicons/core-free-icons";

export default async function StoryDetailsPage({
  params,
}: {
  params: { slug: string };
}) {
  // Extract slug from params (params is a promise in Next.js 15, but usually available directly in server components if not dynamic route. Assuming standard next.js usage)
  const resolvedParams = await params;
  const story = await getStoryDetail(resolvedParams.slug);

  if (!story) {
    notFound();
  }

  // Helper for impact color
  const getImpactColor = (impact?: string | null) => {
    switch (impact?.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "HIGH":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Navigation */}
      <Link
        href="/stories"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="mr-2 h-4 w-4" />
        Back to Stories
      </Link>

      {/* Hero Section (Intelligence Dossier) */}
      <div className="rounded-[2rem] border border-border bg-card/40 backdrop-blur-xl p-8 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-50" />

        <div className="flex flex-wrap items-center gap-4 mb-6">
          {story.impact && (
            <Badge
              variant="outline"
              className={`font-bold tracking-widest uppercase text-xs ${getImpactColor(story.impact)}`}
            >
              {story.impact}
            </Badge>
          )}
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <HugeiconsIcon icon={Clock01Icon} className="h-4 w-4" />
            Last updated {new Date(story.updatedAt).toLocaleDateString()}
          </span>
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <HugeiconsIcon icon={Earth} className="h-4 w-4" />
            {story.articleCount} Articles
          </span>
          {story.status && (
            <span className="text-sm font-medium text-red-400 flex items-center gap-1.5 ml-auto">
              <HugeiconsIcon icon={TradeUpIcon} className="h-4 w-4" />
              Status: {story.status}
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl mb-8">
          {story.title}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Context Tags */}
          <div className="space-y-3 bg-muted/30 rounded-2xl p-5 border border-border/50 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Regions
            </p>
            <div className="flex flex-wrap gap-2">
              {story.regions && story.regions.length > 0 ? (
                story.regions.map((r) => (
                  <Badge key={r} variant="secondary">
                    {r}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  Global Context
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3 bg-muted/30 rounded-2xl p-5 border border-border/50 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Themes
            </p>
            <div className="flex flex-wrap gap-2">
              {story.themes && story.themes.length > 0 ? (
                story.themes.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">General</span>
              )}
            </div>
          </div>

          <div className="space-y-3 bg-muted/30 rounded-2xl p-5 border border-border/50 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Top Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {story.topSources && story.topSources.length > 0 ? (
                story.topSources.slice(0, 4).map((s) => (
                  <Badge key={s} variant="outline" className="bg-background/50">
                    {s}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  Multi-Source
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Main Feed & Analysis) */}
        <div className="lg:col-span-8 space-y-8">
          {/* AI Summary & Why it Matters */}
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

          {/* Source Feed */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-tight">
                Multi-Source Perspectives
              </h2>
              <Badge variant="outline">{story.articles.length} Reports</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {story.articles.map((processedArticle: any) => {
                // Map the combined DB object to the Article shape expected by ArticleCard
                const mappedArticle = {
                  id: processedArticle.id,
                  title: processedArticle.rawArticle.title,
                  source: processedArticle.rawArticle.source,
                  publishedAt: processedArticle.rawArticle.publishedAt,
                  contentSnippet: processedArticle.rawArticle.contentSnippet,
                  slug: processedArticle.rawArticle.slug,
                  sentimentScore: processedArticle.sentimentScore,
                  biasCategory: processedArticle.biasCategory,
                  categories: processedArticle.categories,
                  perspectiveCountries: processedArticle.perspectiveCountries,
                };
                return (
                  <ArticleCard
                    key={processedArticle.id}
                    article={mappedArticle as any}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar Widgets) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Timeline Widget */}
          <div className="rounded-[2rem] border border-border bg-card/40 backdrop-blur-xl p-6 shadow-sm sticky top-24">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
              Timeline of Developments
            </h3>

            <div className="relative ml-2 space-y-6 border-l-2 border-border/60 pl-6">
              {story.keyDevelopments && story.keyDevelopments.length > 0 ? (
                story.keyDevelopments.map((dev: any, index: number) => (
                  <div key={index} className="relative group/timeline">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-muted bg-background ring-4 ring-card transition-colors duration-300 group-hover/timeline:border-primary group-hover/timeline:bg-primary/20" />

                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-semibold text-foreground/90 transition-colors group-hover/timeline:text-foreground">
                        {dev.title}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground/80 mb-1">
                        {dev.date}
                      </div>
                      {dev.description && (
                        <p className="text-xs text-muted-foreground">
                          {dev.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No key developments tracked yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
