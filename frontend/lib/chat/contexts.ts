import type { ContextItem } from "@/components/chat/types";

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
  biasCategory?: string | null;
  sentimentScore?: number | null;
  perspectiveCountries?: string[];
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
      biasNote: article.biasNote,
      biasCategory: article.biasCategory,
      sentimentScore: article.sentimentScore,
      perspectiveCountries: article.perspectiveCountries,
      entities: article.entities,
      sourceCountry: article.sourceCountry,
    },
  };
}
