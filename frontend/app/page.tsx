import ArticleCard from "@/components/articles/ArticleCard";
import Filters from "@/components/Feed/Filters";
import { BiasDistributionWidget } from "@/components/widgets/BiasDistributionWidget";
import { DiversityInsightWidget } from "@/components/widgets/DiversityInsightWidget";
import { EventClustersWidget } from "@/components/widgets/EventClustersWidget";
import { PerspectiveWidget } from "@/components/widgets/PerspectiveWidget";
import { getArticles } from "@/queries/articles";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category =
    typeof params.category === "string" ? params.category : "all";
  const sort = typeof params.sort === "string" ? params.sort : "latest";
  const search = typeof params.search === "string" ? params.search : "";

  const articles = await getArticles({ category, sort, search });

  console.log("articles: ", articles);

  return (
    <div className="flex flex-1 w-full">
      {/*Feed: Main content area*/}
      <div className="flex-1 min-w-0 p-5 space-y-5">
        <Filters totalArticles={articles.length} />

        {/*Articles*/}
        <div>
          {articles.length === 0 && search ? (
            <p className="text-muted-foreground text-sm py-10 text-center">
              No articles found for{" "}
              <span className="text-foreground font-medium">"{search}"</span>
            </p>
          ) : (
            articles.map((article, i) => (
              <div key={i} className="mb-5">
                <ArticleCard article={article} />
              </div>
            ))
          )}
        </div>

        {/* Infinite scroll sentinel */}
        {/*<div ref={sentinelRef} className="h-10 flex items-center justify-center">
          {isFetchingNextPage && (
            <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
          )}
        </div>*/}
      </div>

      {/* Information Widgets — only on xl+ */}
      <div className="hidden xl:flex xl:w-72 shrink-0 p-4 pl-1">
        <aside className="sticky top-5 flex flex-col space-y-4 overflow-y-auto w-full max-h-[calc(100vh-6rem)] scrollbar-hide pb-10">
          <PerspectiveWidget />
          <EventClustersWidget />
          <BiasDistributionWidget />
          <DiversityInsightWidget />
        </aside>
      </div>
    </div>
  );
}
