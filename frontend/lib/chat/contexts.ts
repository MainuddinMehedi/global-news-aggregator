import type { ContextItem } from "@/types/chat";

type IncomingContext = ContextItem & {
  sourceId?: string;
  sourceType?: string;
  snapshot?: unknown;
};

export function normalizeContextForDb(item: IncomingContext) {
  const sourceType = item.sourceType ?? item.type;
  const sourceId = item.sourceId ?? item.id;

  return {
    sourceType,
    sourceId,
    title: item.title,
    url: item.url ?? null,
    snapshot: item.snapshot ?? item,
  };
}

export function contextFromArticle(article: {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  contentSnippet: string;
  extractedContent?: string | null;
  biasNote?: string | null;
  eventRegion?: string | null;
  sentimentScore?: number | null;
  categories?: { name: string }[];
  entities?: string[];
  sourceCountry?: string | null;
}): ContextItem & { sourceId: string; sourceType: string; snapshot: unknown } {
  return {
    id: article.id,
    sourceId: article.id,
    sourceType: "article",
    title: article.title,
    type: "article",
    url: article.url,
    snapshot: {
      id: article.id,
      title: article.title,
      source: article.source,
      publishedAt: article.publishedAt,
      url: article.url,
      contentSnippet: article.contentSnippet,
      extractedContent: article.extractedContent,
      eventRegion: article.eventRegion,
      sentimentScore: article.sentimentScore,
      categories: article.categories?.map((c) => c.name),
      entities: article.entities,
      sourceCountry: article.sourceCountry,
    },
  };
}
