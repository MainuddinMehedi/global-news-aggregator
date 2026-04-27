import { streamText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Use OpenRouter as the AI provider for frontend chat
// Falls back to a mock response if no API key is configured
const openrouter = createOpenAI({
  baseURL: process.env.AI_OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.AI_OPENROUTER_API_KEY || "",
});

const searchArticlesSchema = z.object({
  query: z.string().describe("Search keywords"),
  category: z.string().optional().describe("Category to filter by"),
  daysBack: z.number().default(7).describe("How many days back to search"),
});

const tools = {
  search_articles: tool({
    description:
      "Search for news articles in the database by keyword, category, or date range",
    inputSchema: searchArticlesSchema,
    execute: async ({ query, category, daysBack }: z.infer<typeof searchArticlesSchema>) => {
      const since = new Date(Date.now() - daysBack * 86400000);
      const where: any = {
        rawArticle: { publishedAt: { gte: since } },
      };
      if (category)
        where.categories = { some: { name: category } };
      if (query)
        where.rawArticle = {
          ...where.rawArticle,
          title: { contains: query, mode: "insensitive" },
        };

      const results = await prisma.processedArticle.findMany({
        where,
        take: 10,
        include: { rawArticle: true, categories: true },
        orderBy: { rawArticle: { publishedAt: "desc" } },
      });

      return results.map((r) => ({
        title: r.rawArticle.title,
        source: r.rawArticle.source,
        bias: r.biasCategory,
        sentiment: r.sentimentScore,
        date: r.rawArticle.publishedAt?.toISOString(),
        categories: r.categories.map((c) => c.name),
        snippet: r.rawArticle.contentSnippet.substring(0, 200),
      }));
    },
  }),
};

export async function POST(req: Request) {
  try {
    const { messages, articleContext } = await req.json();

    // Check if OpenRouter API key is configured
    if (!process.env.AI_OPENROUTER_API_KEY) {
      // Return a helpful mock response when no API key is set
      return new Response(
        JSON.stringify({
          id: "mock",
          role: "assistant",
          content:
            "⚠️ AI chat is not configured yet. Set `AI_OPENROUTER_API_KEY` in your `.env` file to enable AI responses. In the meantime, the UI is fully functional for browsing and filtering articles.",
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = articleContext
      ? `You are a geopolitical news analyst. The user is asking about this article:

Title: ${articleContext.title}
Source: ${articleContext.source}
Bias: ${articleContext.biasCategory || "Unknown"}
Sentiment: ${articleContext.sentimentScore ?? "N/A"}
Categories: ${articleContext.categories?.join(", ") || "None"}
Entities: ${articleContext.entities?.join(", ") || "None"}
Content: ${articleContext.contentSnippet}
Perspective Countries: ${articleContext.perspectiveCountries?.join(", ") || "None"}

Provide insightful analysis. Use the search_articles tool to find related articles for comparison. Be concise but thorough.`
      : `You are a geopolitical news analyst. Use the search_articles tool to find articles in the database and provide data-backed answers. Be concise and cite sources.`;

    const model = process.env.AI_OPENROUTER_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

    const result = streamText({
      model: openrouter(model),
      messages,
      tools,
      system: systemPrompt,
      maxOutputTokens: 1000,
      onFinish: async ({ usage }) => {
        // Log usage after stream completes
        try {
          if (usage) {
            await prisma.aiUsage.create({
              data: {
                date: new Date().toISOString().split("T")[0],
                provider: "openrouter",
                model,
                tokensUsed: (usage.inputTokens || 0) + (usage.outputTokens || 0),
                estimatedCost: ((usage.inputTokens || 0) + (usage.outputTokens || 0)) * 0.0000005,
                success: true,
              },
            });
          }
        } catch {
          // Don't fail the response if usage logging fails
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Chat failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
