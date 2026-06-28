import { Article } from "@/types/article";
import { getPublisherRegion } from "@/lib/utils";

export interface RawArticleData {
  id: string;
  rawArticle: {
    title: string;
    source: string;
    publishedAt: Date;
    contentSnippet: string | null;
    extractedContent: string | null;
    url: string;
    sourceCountry: string | null;
    sourceType: string | null;
    biasGroup: string | null;
    coverageScope: string | null;
    slug: string | null;
  };
  biasNote: string | null;
  eventRegion: string | null;
  sentimentScore: number | null;
  categories: { id: string; name: string }[];
  entities: string[];
}

export function mapArticle(raw: RawArticleData): Article {
  return {
    id: raw.id,
    title: raw.rawArticle.title,
    source: raw.rawArticle.source,
    publishedAt: raw.rawArticle.publishedAt.toISOString(),
    contentSnippet: raw.rawArticle.contentSnippet || "",
    extractedContent: raw.rawArticle.extractedContent,
    biasNote: raw.biasNote,
    eventRegion: raw.eventRegion,
    sentimentScore: raw.sentimentScore,
    url: raw.rawArticle.url,
    categories: raw.categories,
    entities: raw.entities,
    sourceCountry: raw.rawArticle.sourceCountry,
    sourceOrigin: getPublisherRegion(raw.rawArticle.sourceCountry),
    sourceType: raw.rawArticle.sourceType,
    biasGroup: raw.rawArticle.biasGroup,
    coverageScope: raw.rawArticle.coverageScope,
    slug: raw.rawArticle.slug,
  };
}
