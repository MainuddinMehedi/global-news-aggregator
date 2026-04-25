import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const country = searchParams.get("country");

  const where: any = {};
  if (category && category !== "all") where.categories = { some: { name: category } };
  if (country) where.rawArticle = { sourceCountry: country };

  try {
    const processedArticles = await prisma.processedArticle.findMany({
      where,
      orderBy: { rawArticle: { publishedAt: "desc" } },
      take: 50,
      include: { categories: true, rawArticle: true },
    });

    const articles = processedArticles.map(pa => ({
      id: pa.id,
      title: pa.rawArticle.title,
      source: pa.rawArticle.source,
      publishedAt: pa.rawArticle.publishedAt,
      contentSnippet: pa.rawArticle.contentSnippet,
      biasNote: pa.biasNote,
      sentimentScore: pa.sentimentScore,
      perspectiveCountries: pa.perspectiveCountries,
      url: pa.rawArticle.url,
      categories: pa.categories,
    }));

    return NextResponse.json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}
