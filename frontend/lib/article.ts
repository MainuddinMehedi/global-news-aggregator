import { ProcessedArticle, RawArticle, Category } from "@news/db";
import { Article } from "@/types/article";
import { getPublisherRegion } from "@/lib/utils";

export interface ProcessedArticleWithRaw extends ProcessedArticle {
  rawArticle: RawArticle;
  categories: Category[];
}

/**
 * Maps a processed article (with its joined rawArticle and categories) to the frontend Article model.
 */
export function mapProcessedArticleToArticle(article: ProcessedArticleWithRaw): Article {
  if (!article) {
    throw new Error("Cannot map null or undefined article");
  }
  
  const raw = article.rawArticle;
  if (!raw) {
    throw new Error("Raw article data is missing; cannot perform mapping");
  }

  return {
    id: article.id,
    title: raw.title,
    source: raw.source,
    publishedAt: raw.publishedAt instanceof Date 
      ? raw.publishedAt.toISOString() 
      : String(raw.publishedAt),
    contentSnippet: raw.contentSnippet,
    extractedContent: raw.extractedContent ?? null,
    biasNote: article.biasNote ?? null,
    eventRegion: article.eventRegion ?? null,
    sentimentScore: article.sentimentScore ?? null,
    url: raw.url,
    categories: article.categories || [],
    entities: article.entities || [],
    sourceCountry: raw.sourceCountry ?? null,
    sourceOrigin: getPublisherRegion(raw.sourceCountry),
    sourceType: raw.sourceType ?? null,
    biasGroup: raw.biasGroup ?? null,
    coverageScope: raw.coverageScope ?? null,
    slug: raw.slug ?? null,
  };
}
