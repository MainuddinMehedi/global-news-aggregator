import prisma from "@/lib/prisma";
import { Article } from "@/types/article";
import { TopicFinding } from "@/types/lockedTopic";

export async function getUserBookmarkedArticles(
  userId: string,
): Promise<Article[]> {
  const articleBookmarks = await prisma.articleBookmark.findMany({
    where: { userId },
    include: {
      article: {
        include: {
          rawArticle: true,
          categories: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return articleBookmarks.map((b) => {
    const article = b.article;

    return {
      id: article.id,
      title: article.rawArticle.title,
      source: article.rawArticle.source,
      publishedAt: article.rawArticle.publishedAt.toISOString(),
      contentSnippet: article.rawArticle.contentSnippet,
      extractedContent: article.rawArticle.extractedContent,
      biasNote: article.biasNote,
      eventRegion: article.eventRegion,
      sentimentScore: article.sentimentScore,
      url: article.rawArticle.url,
      categories: article.categories,
      entities: article.entities,
      sourceCountry: article.rawArticle.sourceCountry,
      slug: article.rawArticle.slug,
    };
  }) as unknown as Article[];
}

export async function getUserBookmarkedFindings(
  userId: string,
): Promise<TopicFinding[]> {
  const findingBookmarks = await prisma.findingBookmark.findMany({
    where: { userId },
    include: {
      finding: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return findingBookmarks.map((b) => b.finding) as unknown as TopicFinding[];
}
