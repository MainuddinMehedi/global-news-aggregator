import ArticleFeed from "@/components/Feed/ArticleFeed";
import Filters from "@/components/Feed/Filters";
import { BiasDistributionWidget } from "@/components/widgets/BiasDistributionWidget";
import { DiversityInsightWidget } from "@/components/widgets/DiversityInsightWidget";
import { EventClustersWidget } from "@/components/widgets/EventClustersWidget";
import { PerspectiveWidget } from "@/components/widgets/PerspectiveWidget";
import { getArticles, getArticleById } from "@/queries/articles";
import { ArticleDetailsModal } from "@/components/articles/ArticleDetailsModal";
import { Suspense } from "react";

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
  const articleId =
    typeof params.article === "string" ? params.article : undefined;

  const { articles, nextCursor } = await getArticles({
    category,
    sort,
    search,
  });

  const selectedArticle = articleId ? await getArticleById(articleId) : null;

  return (
    <div className="flex flex-1 w-full">
      {/* Feed: Main content area */}
      <div className="flex-1 min-w-0 p-5 space-y-5">
        <Filters />

        {/*
          key forces a full remount when filters change, resetting the article
          list and cursor so the new first page doesn't append to the old one.
        */}
        <ArticleFeed
          key={`${category}|${sort}|${search}`}
          initialArticles={articles}
          initialCursor={nextCursor}
          category={category}
          sort={sort}
          search={search}
        />
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

      {/* Details Modal */}
      {articleId && (
        <Suspense fallback={null}>
          <ArticleDetailsModal article={selectedArticle} />
        </Suspense>
      )}
    </div>
  );
}
