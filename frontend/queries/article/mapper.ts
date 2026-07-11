import { Article } from "@/types/article";
import { getPublisherRegion } from "@/utils/regions";
import { Prisma } from "@news/db/client";

export type RawArticleData = Prisma.ProcessedArticleGetPayload<{
  include: { rawArticle: true; categories: true };
}>;

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
    entities: [], // entities is not fetched in this include block
    sourceCountry: raw.rawArticle?.sourceCountry || null,
    sourceOrigin: getPublisherRegion(raw.rawArticle.sourceCountry),
    sourceType: raw.rawArticle.sourceType,
    biasGroup: raw.rawArticle.biasGroup,
    coverageScope: raw.rawArticle.coverageScope,
    slug: raw.rawArticle.slug,
  };
}
