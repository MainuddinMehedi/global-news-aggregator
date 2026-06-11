export interface Article {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  contentSnippet: string;
  extractedContent: string | null;
  biasNote: string | null;
  eventRegion: string | null;
  sentimentScore: number | null;
  perspectiveCountries: string[];
  url: string;
  categories: { id: string; name: string }[];
  entities: string[];
  sourceCountry: string | null;
  sourceOrigin: string | null;
  sourceType: string | null;
  slug: string | null;
}
