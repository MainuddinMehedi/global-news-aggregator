import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const country = searchParams.get("country");
  const cursor = searchParams.get("cursor");
  const search = searchParams.get("q");
  const limit = 20;

  const where: any = {};
  if (category && category !== "all")
    where.categories = { some: { name: category } };
  if (country) where.rawArticle = { sourceCountry: country };
  if (search) {
    where.rawArticle = {
      ...where.rawArticle,
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { contentSnippet: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  try {
    const processedArticles = await prisma.processedArticle.findMany({
      where,
      orderBy: { rawArticle: { publishedAt: "desc" } },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { categories: true, rawArticle: true },
    });

    let nextCursor: string | undefined;
    if (processedArticles.length > limit) {
      nextCursor = processedArticles.pop()!.id;
    }

    const articles = processedArticles.map((pa) => ({
      id: pa.id,
      title: pa.rawArticle.title,
      source: pa.rawArticle.source,
      publishedAt: pa.rawArticle.publishedAt,
      contentSnippet: pa.rawArticle.contentSnippet,
      biasNote: pa.biasNote,
      biasCategory: pa.biasCategory,
      sentimentScore: pa.sentimentScore,
      perspectiveCountries: pa.perspectiveCountries,
      url: pa.rawArticle.url,
      categories: pa.categories,
      entities: pa.entities,
      sourceCountry: pa.rawArticle.sourceCountry,
    }));

    return NextResponse.json({ articles, nextCursor });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
