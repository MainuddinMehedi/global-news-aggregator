import { NextResponse } from "next/server";
import { extract } from "@extractus/article-extractor";
import { marked } from "marked";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // 1. Check if we already have the extracted content in the database
  try {
    const existing = await prisma.rawArticle.findUnique({
      where: { url },
      select: { extractedContent: true },
    });

    if (existing?.extractedContent) {
      return NextResponse.json({
        content: existing.extractedContent,
        source: "database",
      });
    }
  } catch (error) {
    console.error("[Extract API] DB check failed, proceeding to extract:", error);
  }

  let finalContent: string | null = null;
  let sourceUsed = "";

  try {
    // 2. Try Primary: @extractus/article-extractor
    const article = await extract(url);

    if (article && article.content) {
      finalContent = article.content;
      sourceUsed = "extractus";
    } else {
      throw new Error("Extractus returned empty result");
    }
  } catch (error) {
    console.warn(`[Extract API] Primary failed for ${url}, falling back to Jina:`, error);

    try {
      // 3. Fallback: Jina Reader API
      const jinaResponse = await fetch(`https://r.jina.ai/${url}`, {
        headers: { Accept: "application/json" },
      });

      if (!jinaResponse.ok) {
        throw new Error(`Jina failed with status ${jinaResponse.status}`);
      }

      const jinaData = await jinaResponse.json();

      if (jinaData && jinaData.data && jinaData.data.content) {
        // Convert Markdown to HTML using marked
        const markdownContent = jinaData.data.content;
        finalContent = await marked.parse(markdownContent);
        sourceUsed = "jina";
      } else {
        throw new Error("Jina returned empty result");
      }
    } catch (jinaError) {
      console.error(`[Extract API] Both extractors failed for ${url}:`, jinaError);
      return NextResponse.json(
        { error: "Failed to extract article content" },
        { status: 500 }
      );
    }
  }

  if (finalContent) {
    return NextResponse.json({
      content: finalContent,
      source: sourceUsed,
    });
  }

  return NextResponse.json(
    { error: "Failed to extract article content" },
    { status: 500 }
  );
}
