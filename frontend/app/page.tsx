import { auth } from "@/auth";
import { DiversityInsightWidget } from "@/components/analytics/DiversityInsightWidget";
import FeedError from "@/components/Feed/FeedError";
import Filters from "@/components/Feed/filters/Filters";
import ArticleFeed from "@/components/Feed/layouts/ArticleFeed";
import { ArticleFeedSkeleton } from "@/components/skeletons/home/ArticleFeedSkeleton";
import { EventClustersWidget } from "@/components/widgets/events/EventClustersWidget";
import { SourceOriginWidget } from "@/components/widgets/sources/SourceOriginWidget";
import { BUILTIN_SOURCES } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { getArticleById, getArticles } from "@/queries/articles";
import { Article } from "@/types/article";
import { Suspense } from "react";

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function Home({ searchParams }: HomeProps) {
  // Note: activeStoryTitle requires a DB fetch.
  // We can pass `story` to Filters, and Filters will show "Story Mode"
  // without needing the exact title instantly, or we can just pass it as undefined for the initial shell.
  // Wait, Filters actually expects activeStoryTitle to render the blue active story header.
  // For true PPR, we'll let MainFeedLoader render the active story header if needed, or pass it as undefined.

  return (
    <div className="flex flex-1 w-full">
      {/* Feed: Main content area */}
      <div className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
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

  let userSettings: any = {};
  let enabledSources: string[] | undefined = undefined;
  let hiddenCategories: string[] | undefined = undefined;

  const session = await auth();

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { settings: true },
    });

    if (user) {
      userSettings = (user.settings || {}) as any;

      const customSources = userSettings.customSources || [];
      const disabledBuiltins = userSettings.disabledBuiltinSources || [];

      hiddenCategories = userSettings.hiddenCategories || [];

      const enabledCustomNames = customSources
        .filter((s: any) => s.enabled)
        .map((s: any) => s.name);

      const enabledBuiltinNames = BUILTIN_SOURCES.filter(
        (s) => !disabledBuiltins.includes(s.url),
      ).map((s) => s.name);

      enabledSources = [...enabledCustomNames, ...enabledBuiltinNames];
    }
  }

  const category =
    typeof params.category === "string"
      ? params.category
      : userSettings.feedDefaultCategory || "all";

  let normalizedSort = userSettings.feedDefaultSort || "latest";
  if (normalizedSort === "newest") normalizedSort = "latest";
  const sort = typeof params.sort === "string" ? params.sort : normalizedSort;

  const search = typeof params.search === "string" ? params.search : "";
  const region =
    typeof params.region === "string"
      ? params.region
      : userSettings.feedDefaultRegion || "all";
  const srcOrigin =
    typeof params.srcOrigin === "string" ? params.srcOrigin : "all";
  const type = typeof params.type === "string" ? params.type : "all";
  const story = typeof params.story === "string" ? params.story : "all";
  const bias = typeof params.bias === "string" ? params.bias : "all";
  const scope = typeof params.scope === "string" ? params.scope : "all";
  const articleId =
    typeof params.article === "string" ? params.article : undefined;
  const take = userSettings.articlesPerPage || 20;

  const mode = userSettings.homePageMode || "daily";
  const feedDate =
    mode === "daily"
      ? typeof params.date === "string"
        ? params.date
        : new Date().toISOString().split("T")[0]
      : undefined;

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
      <Filters 
        searchParams={searchParams} 
        defaultRegion={userSettings.feedDefaultRegion || "all"} 
        defaultSort={normalizedSort} 
      />
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
