import { getCachedFeedSources } from "@/queries/feedSources";

/**
 * Resolves the active feed parameters by merging the URL search parameters
 * with the user's saved database settings.
 *
 * If a parameter exists in the URL (searchParams), it takes precedence.
 * Otherwise, it falls back to the user's default setting, or a system default (like "all").
 *
 * @param searchParams - The raw URL search params object from Next.js (usually a plain object)
 * @param userSettings - The user's settings object fetched from the database
 * @returns An object containing all fully resolved filter parameters.
 */
export async function resolveFeedParams(searchParams: any, userSettings: any) {
  let enabledSources: string[] | undefined = undefined;
  let hiddenCategories: string[] | undefined = undefined;

  // 1. Resolve Sources and Hidden Categories
  if (userSettings && Object.keys(userSettings).length > 0) {
    const disabledBuiltins = userSettings.disabledBuiltinSources || [];

    // Fetch global DB sources
    const globalSources = await getCachedFeedSources();

    const enabledGlobalNames = globalSources
      .filter((s: any) => !disabledBuiltins.includes(s.url))
      .map((s: any) => s.name);

    enabledSources = [...enabledGlobalNames];
    hiddenCategories = userSettings.hiddenCategories || [];
  }

  // 2. Resolve Active Category
  const defaultCategory = userSettings.feedDefaultCategory;
  const category =
    typeof searchParams.category === "string"
      ? searchParams.category
      : defaultCategory;

  // 3. Resolve Sort Order (handling legacy "newest" state)
  let defaultSort = userSettings.feedDefaultSort;
  if (defaultSort === "newest") defaultSort = "latest";
  const sort =
    typeof searchParams.sort === "string" ? searchParams.sort : defaultSort;

  // 4. Resolve Region
  const defaultRegion = userSettings.feedDefaultRegion;
  const region =
    typeof searchParams.region === "string"
      ? searchParams.region
      : defaultRegion;

  // 5. Resolve Simple String Filters (search, type, bias, etc)
  const search =
    typeof searchParams.search === "string" ? searchParams.search : "";
  const srcOrigin =
    typeof searchParams.srcOrigin === "string" ? searchParams.srcOrigin : "all";
  const type =
    typeof searchParams.type === "string" ? searchParams.type : "all";
  const story =
    typeof searchParams.story === "string" ? searchParams.story : "all";
  const bias =
    typeof searchParams.bias === "string" ? searchParams.bias : "all";
  const scope =
    typeof searchParams.scope === "string" ? searchParams.scope : "all";
  const cursor =
    typeof searchParams.cursor === "string" ? searchParams.cursor : undefined;

  // 6. Resolve Date and Article Mode
  const mode = userSettings.homePageMode;
  const feedDate =
    mode === "daily"
      ? typeof searchParams.date === "string"
        ? searchParams.date
        : new Date().toISOString().split("T")[0]
      : undefined;

  const articleId =
    typeof searchParams.article === "string" ? searchParams.article : undefined;

  return {
    category,
    defaultCategory,
    sort,
    defaultSort,
    region,
    defaultRegion,
    search,
    srcOrigin,
    type,
    story,
    bias,
    scope,
    cursor,
    feedDate,
    articleId,
    mode,
    enabledSources,
    hiddenCategories,
  };
}
