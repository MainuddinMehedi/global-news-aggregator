import { DiversityInsightWidget } from "@/components/analytics/DiversityInsightWidget";
import FeedError from "@/components/Feed/FeedError";
import Filters from "@/components/Feed/filters/Filters";
import ArticleFeed from "@/components/Feed/layouts/ArticleFeed";
import { ArticleFeedSkeleton } from "@/components/skeletons/home/ArticleFeedSkeleton";
import { FiltersSkeleton } from "@/components/skeletons/home/FiltersSkeleton";
import { EventClustersWidget } from "@/components/widgets/events/EventClustersWidget";
import { SourceOriginWidget } from "@/components/widgets/sources/SourceOriginWidget";
import { resolveFeedParams } from "@/lib/helpers/feedParamsResolver";
import { getArticleById, getArticles } from "@/queries/articles";
import { getCachedUserSettings } from "@/queries/userSettings";
import { Article } from "@/types/article";
import { Suspense } from "react";

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function Home({ searchParams }: HomeProps) {
  return (
    <div className="flex flex-1 w-full">
      {/* Feed: Main content area */}
      <div className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <Suspense fallback={<FiltersSkeleton />}>
          <Filters searchParams={searchParams} />
        </Suspense>

        <Suspense fallback={<ArticleFeedSkeleton />}>
          <MainFeedLoader searchParams={searchParams} />
        </Suspense>
      </div>

      {/* Information Widgets — only on xl+ */}
      <div className="hidden xl:flex xl:w-72 shrink-0 p-4 pl-1">
        <aside className="sticky top-5 flex flex-col space-y-4 overflow-y-auto w-full max-h-[calc(100vh-6rem)] scrollbar-hide pb-10">
          <SourceOriginWidget />
          <EventClustersWidget />
          <DiversityInsightWidget />
        </aside>
      </div>
    </div>
  );
}

interface MainFeedLoaderProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function MainFeedLoader({ searchParams }: MainFeedLoaderProps) {
  const params = await searchParams;
  const userSettings = await getCachedUserSettings();

  const {
    category,
    sort,
    region,
    search,
    srcOrigin,
    type,
    story,
    bias,
    scope,
    feedDate,
    articleId,
    mode,
    enabledSources,
    hiddenCategories,
  } = resolveFeedParams(params, userSettings);

  const take = userSettings.articlesPerPage || 20;

  let articles: Article[] = [];
  let nextCursor = null;
  let selectedArticle = null;
  let error: string | null = null;

  try {
    // Fetch articles and selected article in parallel
    const [result, selected] = await Promise.all([
      getArticles({
        category,
        sort,
        search,
        region,
        srcOrigin,
        type,
        story,
        bias,
        scope,
        date: feedDate,
        enabledSources,
        hiddenCategories,
        take,
      }),
      articleId ? getArticleById(articleId) : Promise.resolve(null),
    ]);

    articles = result.articles;
    nextCursor = result.nextCursor;
    selectedArticle = selected;
  } catch (e) {
    console.error("Home Page Fetch Error:", e);
    error =
      e instanceof Error
        ? e.message
        : "Failed to load articles. Please try again later.";
  }

  if (error) {
    return <FeedError message={error} />;
  }

  return (
    <>
      <ArticleFeed
        mode={mode}
        key={`${category}|${sort}|${search}|${region}|${srcOrigin}|${type}|${story}|${bias}|${scope}|${feedDate}|${enabledSources?.join(",")}`}
        initialArticles={articles}
        initialCursor={nextCursor}
        initialDate={feedDate}
        category={category}
        sort={sort}
        search={search}
        region={region}
        srcOrigin={srcOrigin}
        type={type}
        story={story}
        bias={bias}
        scope={scope}
      />
    </>
  );
}
