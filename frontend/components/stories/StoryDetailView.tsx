import { StoryArticlesGrid } from "@/components/stories/grid/StoryArticlesGrid";
import StoryHero from "@/components/stories/grid/StoryHero";
import { PerspectiveWidget } from "@/components/stories/PerspectiveWidget";
import { StoryAnalysis } from "@/components/stories/StoryAnalysis";
import { StoryTimelineSidebar } from "@/components/stories/timeline/StoryTimelineSidebar";
import { mapProcessedArticleToArticle } from "@/lib/article";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

interface StoryDetailViewProps {
  story: any; // Using any for now, or you can import the specific type if available
  sources: Array<{ name: string; url: string }>;
  origins: string[];
  slug: string;
  isModal?: boolean;
}

export function StoryDetailView({
  story,
  sources,
  origins,
  slug,
  isModal,
}: StoryDetailViewProps) {
  return (
    <div
      className={`w-full space-y-8 ${!isModal ? "mx-auto max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8" : ""}`}
    >
      {!isModal && (
        <Link
          href="/stories"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="mr-2 h-4 w-4" />
          Back to Stories
        </Link>
      )}

      <StoryHero story={story} sources={sources} origins={origins} />

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
          <PerspectiveWidget
            articles={story.articles.map(mapProcessedArticleToArticle)}
          />
        </div>

        {/* Row 3, Left: Multi-Source Perspectives Articles Listing */}
        <StoryArticlesGrid articles={story.articles} slug={slug} />
      </div>
    </div>
  );
}
