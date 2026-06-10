import { NextRequest, NextResponse } from "next/server";
import { getArticles } from "@/queries/articles";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  try {
    const data = await getArticles({
      category:    searchParams.get("category")    ?? "all",
      sort:        searchParams.get("sort")        ?? "latest",
      search:      searchParams.get("search")      ?? "",
      perspective: searchParams.get("perspective") ?? undefined,
      story:       searchParams.get("story")       ?? undefined,
      cursor:      searchParams.get("cursor")      ?? undefined,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
