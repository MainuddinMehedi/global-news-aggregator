import { NextResponse } from "next/server";
import { extract } from "@extractus/article-extractor";
import { marked } from "marked";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    // 1. Try Primary: @extractus/article-extractor
    const article = await extract(url);

    if (article && article.content) {
      return NextResponse.json({
        title: article.title,
        content: article.content, // HTML
        textContent: article.content, // Actually extractus has .content and maybe plain text, but we'll use HTML
        source: "extractus",
      });
    }

    // 2. Fallback to Jina Reader if extractus returns null or empty
    throw new Error("Extractus returned empty result");
  } catch (error) {
    console.warn(`[Extract API] Primary failed for ${url}, falling back to Jina:`, error);

    try {
      // 2. Fallback: Jina Reader API
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
        const htmlContent = await marked.parse(markdownContent);

        return NextResponse.json({
          title: jinaData.data.title || "Extracted Article",
          content: htmlContent,
          textContent: jinaData.data.text || markdownContent,
          source: "jina",
        });
      }

      throw new Error("Jina returned empty result");
    } catch (jinaError) {
      console.error(`[Extract API] Both extractors failed for ${url}:`, jinaError);
      return NextResponse.json(
        { error: "Failed to extract article content" },
        { status: 500 }
      );
    }
  }
}
