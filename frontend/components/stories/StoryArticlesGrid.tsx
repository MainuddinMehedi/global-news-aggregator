import { Badge } from "@/components/ui/badge";
import ArticleCard from "@/components/articles/ArticleCard";
import { mapProcessedArticleToArticle, ProcessedArticleWithRaw } from "@/lib/article";

interface StoryArticlesGridProps {
  articles: ProcessedArticleWithRaw[];
  slug: string;
}

export function StoryArticlesGrid({ articles, slug }: StoryArticlesGridProps) {
  return (
    <div className="lg:col-span-8 order-4">
      <div>
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-2xl font-extrabold tracking-tight">
            Multi-Source <span className="text-primary">Perspectives</span>
          </h2>
          <Badge
            variant="outline"
            className="rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest"
          >
            {articles.length} {articles.length === 1 ? "Report" : "Reports"}
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((processedArticle) => {
            const mappedArticle = mapProcessedArticleToArticle(processedArticle);

            return (
              <ArticleCard
                key={processedArticle.id}
                article={mappedArticle}
                storySlug={slug}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
