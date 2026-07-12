export type Theme = "light" | "dark" | "system";
export type ColorTheme = "maia" | "ember" | "iris" | "pine" | "slate";

export type HomePageMode = "continuous" | "daily";

export interface DbSettings {
  feedDefaultCategory: string;
  feedDefaultRegion: string;
  feedDefaultSort: string;
  articlesPerPage: number;
  hiddenCategories: string[];
  homePageMode: HomePageMode;
  hasOnboardedSources: boolean;
  disabledBuiltinSources?: string[];
}
