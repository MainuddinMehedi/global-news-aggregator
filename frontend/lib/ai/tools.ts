import { tool, zodSchema } from "ai";
import { z } from "zod";
import { webSearch as exaWebSearch } from "@exalabs/ai-sdk";

const webSearchInputSchema = zodSchema(
  z.object({
    query: z.string().describe("The search query to look up online"),
    count: z
      .number()
      .optional()
      .default(5)
      .describe("Number of search results to return"),
  }),
);

type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
  source?: string;
  published?: string;
};

async function braveSearch(
  query: string,
  count: number,
  signal?: AbortSignal,
): Promise<WebSearchResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) throw new Error("BRAVE_API_KEY not configured");

  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(count));

  const res = await fetch(url.toString(), {
    headers: { "X-Subscription-Token": apiKey, Accept: "application/json" },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Brave search failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    web?: { results?: Array<{ title: string; url: string; description: string }> };
  };

  return (data.web?.results ?? []).slice(0, count).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.description,
    source: "Brave Search",
  }));
}

async function tavilySearch(
  query: string,
  count: number,
  signal?: AbortSignal,
): Promise<WebSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY not configured");

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, query, max_results: count }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Tavily search failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    results?: Array<{ title: string; url: string; content: string }>;
  };

  return (data.results ?? []).slice(0, count).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
    source: "Tavily",
  }));
}

async function exaSearch(
  query: string,
  count: number,
  signal?: AbortSignal,
): Promise<WebSearchResult[]> {
  const exaTool = exaWebSearch({
    numResults: count,
    type: "auto",
    category: "news",
    contents: { text: { maxCharacters: 3000 }, highlights: true },
  });
  const exaExecute = (exaTool as { execute: (...args: unknown[]) => unknown }).execute;
  const data = (await exaExecute(
    { query },
    { abortSignal: signal },
  )) as {
    results?: Array<{
      title: string;
      url: string;
      text?: string;
      highlights?: string[];
      publishedDate?: string;
    }>;
  };

  return (data.results ?? []).slice(0, count).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.highlights?.[0] ?? r.text ?? "",
    source: "Exa",
    published: r.publishedDate,
  }));
}

async function tryEngines(
  query: string,
  count: number,
  signal?: AbortSignal,
): Promise<{ results: WebSearchResult[]; engine: string }> {
  const engines = [
    { name: "Brave", fn: braveSearch },
    { name: "Tavily", fn: tavilySearch },
    { name: "Exa", fn: exaSearch },
  ] as const;

  const errors: string[] = [];
  for (const { name, fn } of engines) {
    try {
      const results = await fn(query, count, signal);
      if (results.length > 0) {
        return { results, engine: name };
      }
    } catch (err) {
      errors.push(`${name}: ${(err as Error).message}`);
    }
  }

  throw new Error(
    `All search engines failed — ${errors.join("; ")}`,
  );
}

export const webSearchTool = tool({
  description:
    "Search the web for current information, news, and data. Use this when the user asks about recent events, facts you are not confident about, or any topic that may have changed since your training data.",
  inputSchema: webSearchInputSchema,
  execute: async ({ query, count }, { abortSignal }) => {
    const { results, engine } = await tryEngines(query, count ?? 5, abortSignal);

    return {
      engine,
      results: results.map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
        source: r.source,
        published: r.published,
      })),
    };
  },
});
