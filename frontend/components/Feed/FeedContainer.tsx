import FeedError from "@/components/Feed/FeedError";
import ArticleFeed from "@/components/Feed/layouts/ArticleFeed";
import { resolveFeedParams } from "@/lib/helpers/feedParamsResolver";
import { getArticleById, getArticles } from "@/queries/articles";
import { getCachedUserSettings } from "@/queries/userSettings";
import { Article } from "@/types/article";

export interface FeedContainerProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function FeedContainer({ searchParams }: FeedContainerProps) {
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
  } = await resolveFeedParams(params, userSettings);

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
