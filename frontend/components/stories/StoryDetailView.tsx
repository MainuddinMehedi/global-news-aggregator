import { StoryArticlesGrid } from "@/components/stories/grid/StoryArticlesGrid";
import StoryHero from "@/components/stories/grid/StoryHero";
import { PerspectiveWidget } from "@/components/stories/PerspectiveWidget";
import { StoryAnalysis } from "@/components/stories/StoryAnalysis";
import { StoryTimelineSidebar } from "@/components/stories/timeline/StoryTimelineSidebar";
import { mapProcessedArticleToArticle } from "@/lib/article";

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
    <div className="w-full space-y-8">
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
