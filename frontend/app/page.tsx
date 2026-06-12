import ArticleFeed from "@/components/Feed/ArticleFeed";
import FeedError from "@/components/Feed/FeedError";
import Filters from "@/components/Feed/Filters";
import { SourceOriginWidget } from "@/components/widgets/SourceOriginWidget";
import { DiversityInsightWidget } from "@/components/widgets/DiversityInsightWidget";
import { EventClustersWidget } from "@/components/widgets/EventClustersWidget";

import { getArticles, getArticleById } from "@/queries/articles";
import { Article } from "@/types/article";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { BUILTIN_SOURCES } from "@/lib/constants";

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
  const region = typeof params.region === "string" ? params.region : "all";
  const origin = typeof params.origin === "string" ? params.origin : "all";
  const type = typeof params.type === "string" ? params.type : "all";
  const story = typeof params.story === "string" ? params.story : "all";
  const articleId =
    typeof params.article === "string" ? params.article : undefined;

  let articles: Article[] = [];
  let nextCursor = null;
  let selectedArticle = null;
  let error: string | null = null;
  let activeStoryTitle: string | undefined = undefined;

  let enabledSources: string[] | undefined = undefined;

  try {
    const session = await auth();
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { settings: true },
      });
      if (user) {
        const settings = (user.settings || {}) as any;
        const customSources = settings.customSources || [];
        const disabledBuiltins = settings.disabledBuiltinSources || [];

        const enabledCustomNames = customSources
          .filter((s: any) => s.enabled)
          .map((s: any) => s.name);

        const enabledBuiltinNames = BUILTIN_SOURCES
          .filter((s) => !disabledBuiltins.includes(s.url))
          .map((s) => s.name);

        enabledSources = [...enabledCustomNames, ...enabledBuiltinNames];
      }
    }

    // Fetch articles, selected article, and story cluster title if active, in parallel
    const [result, selected, storyCluster] = await Promise.all([
      getArticles({ category, sort, search, region, origin, type, story, enabledSources }),
      articleId ? getArticleById(articleId) : Promise.resolve(null),
      story !== "all"
        ? prisma.storyCluster.findUnique({
            where: { slug: story },
            select: { title: true },
          })
        : Promise.resolve(null),
    ]);


    articles = result.articles;
    nextCursor = result.nextCursor;
    selectedArticle = selected;
    if (storyCluster) {
      activeStoryTitle = storyCluster.title;
    }
  } catch (e) {
    console.error("Home Page Fetch Error:", e);
    error =
      e instanceof Error
        ? e.message
        : "Failed to load articles. Please try again later.";
  }

  return (
    <div className="flex flex-1 w-full">
      {/* Feed: Main content area */}
      <div className="flex-1 min-w-0 p-5 space-y-5">
        <Filters
          category={category}
          region={region}
          origin={origin}
          type={type}
          story={story}
          activeStoryTitle={activeStoryTitle}
        />

        {error ? (
          <FeedError message={error} />
        ) : (
          /*
            key forces a full remount when filters change, resetting the article
            list and cursor so the new first page doesn't append to the old one.
          */
          <ArticleFeed
            key={`${category}|${sort}|${search}|${region}|${origin}|${type}|${story}`}
            initialArticles={articles}
            initialCursor={nextCursor}
            category={category}
            sort={sort}
            search={search}
            region={region}
            origin={origin}
            type={type}
            story={story}
            activeStoryTitle={activeStoryTitle}
          />
        )}
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
