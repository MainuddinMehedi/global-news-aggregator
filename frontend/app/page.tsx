import ArticleCard from "@/components/articles/ArticleCard";
import Filters from "@/components/Feed/Filters";
import { BiasDistributionWidget } from "@/components/widgets/BiasDistributionWidget";
import { DiversityInsightWidget } from "@/components/widgets/DiversityInsightWidget";
import { EventClustersWidget } from "@/components/widgets/EventClustersWidget";
import { PerspectiveWidget } from "@/components/widgets/PerspectiveWidget";
import { getArticles } from "@/queries/articles";
import { Article } from "@/types/article";

export default async function Home() {
  const articles = await getArticles();

  console.log("articles: ", articles);

  return (
    <div className="flex flex-1 w-full">
      {/*Feed: Main content area*/}
      <div className="w-[72%] p-5 space-y-5">
        <Filters />

        {/*Articles*/}
        <div>
          {articles.map((article, i) => (
            <div key={i} className="mb-5">
              <ArticleCard article={article} />
            </div>
          ))}
        </div>

        {/* Infinite scroll sentinel */}
        {/*<div ref={sentinelRef} className="h-10 flex items-center justify-center">
          {isFetchingNextPage && (
            <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
          )}
        </div>*/}
      </div>

      {/* Information Widgets */}
      <div className="hidden lg:block lg:w-[28%] p-4 pl-1 relative">
        <aside className="sticky top-5 hidden xl:flex flex-col space-y-4 overflow-y-auto max-h-[calc(100vh-6rem)] scrollbar-hide pb-10">
          <PerspectiveWidget />
          <EventClustersWidget />
          <BiasDistributionWidget />
          <DiversityInsightWidget />
        </aside>
      </div>
    </div>
  );
}
