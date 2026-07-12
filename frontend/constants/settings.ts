import { DbSettings } from "@/types/settings";

export const DEFAULT_SETTINGS: DbSettings = {
  homePageMode: "continuous",
  feedDefaultRegion: "all",
  feedDefaultCategory: "all",
  feedDefaultSort: "latest",
  articlesPerPage: 20,
  hiddenCategories: [],
  disabledBuiltinSources: [],
  hasOnboardedSources: false,
};
