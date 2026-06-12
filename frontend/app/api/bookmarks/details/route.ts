import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const articleBookmarks = await prisma.articleBookmark.findMany({
      where: { userId: session.user.id },
      include: {
        article: {
          include: {
            rawArticle: true,
            categories: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    const findingBookmarks = await prisma.findingBookmark.findMany({
      where: { userId: session.user.id },
      include: {
        finding: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const articles = articleBookmarks.map((b) => {
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
        perspectiveCountries: article.perspectiveCountries,
        url: article.rawArticle.url,
        categories: article.categories,
        entities: article.entities,
        sourceCountry: article.rawArticle.sourceCountry,
        slug: article.rawArticle.slug,
      };
    });

    const findings = findingBookmarks.map((b) => b.finding);

    return NextResponse.json({ articles, findings });
  } catch (error) {
    console.error("Error fetching bookmark details:", error);
    return NextResponse.json({ error: "Failed to fetch bookmark details" }, { status: 500 });
  }
}
