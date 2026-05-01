export interface Article {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  contentSnippet: string;
  biasNote: string | null;
  biasCategory: string | null;
  sentimentScore: number | null;
  perspectiveCountries: string[];
  url: string;
  categories: { id: string; name: string }[];
  entities: string[];
  sourceCountry: string | null;
}
