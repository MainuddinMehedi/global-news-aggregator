import { waitForCapacity, recordUsage, logHeaders } from "./rateLimiter.js";
import { ALLOWED_CATEGORIES } from "./categories.js";

const primaryConfig = {
  baseUrl: process.env.AI_PRIMARY_BASE_URL,
  apiKey: process.env.AI_PRIMARY_API_KEY,
  model: process.env.AI_PRIMARY_MODEL,
  provider: process.env.AI_PRIMARY_PROVIDER,
};

const fallbackConfig = {
  baseUrl: process.env.AI_FALLBACK_BASE_URL,
  apiKey: process.env.AI_FALLBACK_API_KEY,
  model: process.env.AI_FALLBACK_MODEL,
  provider: process.env.AI_FALLBACK_PROVIDER,
};

export function buildBatchPrompt(articles) {
  const articlesContext = articles
    .map(
      (a, i) => `
[ARTICLE ${i + 1}]
- ID: ${a.id}
${a.truncatedContent}
`,
    )
    .join("\n");

  return `You are a geopolitical news analyst. Process the following batch of articles and return ONLY valid JSON.

ARTICLES:
${articlesContext}

TASK:
For EACH article, do the following:
1. Assign 1-3 categories from ONLY this exact list (lowercase, no variations):
   ${ALLOWED_CATEGORIES.join(", ")}
   Distinguish "economy" (macro: GDP, inflation, trade policy, sanctions) from "business" (micro: company earnings, M&A, startups, IPOs, corporate strategy).
   Use "other" if nothing fits. Do NOT invent new category names.
2. Extract named entities (countries, organizations, people) - max 10
3. Score sentiment: -1.0 (very negative) to +1.0 (very positive)
4. Note any detectable bias or perspective (e.g., "Western-centric", "state-media tone")
5. Classify bias category: exactly one of "Western", "Eastern", "Non-Western", "Neutral"
6. List countries whose perspective is represented (ISO codes if possible)

OUTPUT FORMAT (strict JSON, no markdown):
You must return a JSON object with a single key "results", which is an array of objects.
Each object MUST correspond to the article in the same order, and include the article's "id".

{
  "results": [
    {
      "id": "article-id-here",
      "categories": ["geopolitics", "technology"],
      "entities": ["China", "UN", "Xi Jinping"],
      "sentimentScore": 0.3,
      "biasNote": "Neutral reporting with slight institutional framing",
      "biasCategory": "Western",
      "perspectiveCountries": ["CN", "US"]
    }
  ]
}`;
}

async function requestAI(config, prompt, retries = 0) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      parseInt(process.env.AI_TIMEOUT_MS) || 30000,
    );

    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Global News Aggregator",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" }, // Force JSON output
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Handle rate limits
    if (res.status === 429) {
      const retryAfter = res.headers.get("retry-after") || 5;
      console.warn(
        `⚠️ Rate limited by ${config.provider}. Waiting ${retryAfter}s...`,
      );
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      if (retries < (parseInt(process.env.AI_RETRY_ATTEMPTS) || 2)) {
        return requestAI(config, prompt, retries + 1);
      }
      throw new Error("Rate limit exceeded after retries");
    }

    if (!res.ok)
      throw new Error(`API Error ${res.status}: ${await res.text()}`);

    // Log rate limit headers from Groq
    logHeaders(res.headers);

    const data = await res.json();
    const actualTokens = data.usage?.total_tokens || 0;

    // Record actual usage in the rate limiter window
    recordUsage(actualTokens);

    return {
      content: data.choices[0].message.content,
      model: data.model || config.model,
      provider: config.provider,
      tokensUsed: actualTokens,
    };
  } catch (err) {
    if (config === primaryConfig && fallbackConfig.apiKey) {
      console.warn(
        `⚠️ Primary (${primaryConfig.provider}/${primaryConfig.model}) failed, switching to fallback (${fallbackConfig.provider}/${fallbackConfig.model})... Error: ${err.message}`,
      );
      return requestAI(fallbackConfig, prompt, 0);
    }
    throw err;
  }
}

/**
 * Process a batch of articles with AI.
 * Waits for rate limiter capacity before sending the request.
 * @param {Array} batch - Articles to process
 * @param {number} estimatedTokens - Estimated total tokens (from tokenBatcher, with multiplier)
 */
export async function processBatchWithAI(batch, estimatedTokens = 0) {
  const prompt = buildBatchPrompt(batch);

  // Wait for rate limiter capacity before sending
  await waitForCapacity(estimatedTokens);

  return requestAI(primaryConfig, prompt);
}

export function buildClusteringPrompt(articles, activeClusters) {
  const articlesContext = articles
    .map(
      (a, i) => `
[ARTICLE ${i + 1}]
- ID: ${a.id}
- Title: ${a.title}
- Summary: ${a.contentSnippet}
`,
    )
    .join("\n");

  const clustersContext =
    activeClusters.length === 0
      ? "No active clusters."
      : activeClusters
          .map(
            (c) => `
[CLUSTER]
- ID: ${c.id}
- Title: ${c.title}
- Summary: ${c.summary}
`,
          )
          .join("\n");

  return `You are a geopolitical news analyst organizing articles into evolving story clusters. You are building an intelligence dossier.

ACTIVE CLUSTERS:
${clustersContext}

NEW ARTICLES TO CLUSTER:
${articlesContext}

TASK:
For each article, decide if it belongs to an EXISTING cluster or if it represents a major NEW developing story.
- If it matches an active cluster, assign its ID.
- If it's a completely new, major geopolitical event, propose a new cluster. (Do not create new clusters for minor, isolated events; those can be assigned to null/unclustered).

For NEW clusters, you MUST generate the following intelligence metadata:
- impact: One of "CRITICAL", "HIGH", "MEDIUM", "LOW"
- status: One of "ESCALATING", "DEVELOPING", "STABLE", "RESOLVING"
- whyItMatters: A sharp, 1-line analysis of the geopolitical or economic implications of this story.
- regions: Array of affected regions/countries (e.g. ["Middle East", "USA"])
- themes: Array of topics (e.g. ["Trade War", "Elections"])

OUTPUT FORMAT (strict JSON, no markdown):
{
  "assignments": [
    {
      "articleId": "article-id-here",
      "clusterId": "cluster-id-here" // use existing ID, or null if it doesn't fit anywhere and isn't major
    }
  ],
  "newClusters": [
    {
      "tempId": "temp-1",
      "title": "Short, punchy title for new story",
      "summary": "1-2 sentence summary of this new evolving narrative",
      "timeWindow": "Just Started",
      "impact": "HIGH",
      "status": "DEVELOPING",
      "whyItMatters": "This shift could disrupt global semiconductor supply chains.",
      "regions": ["China", "USA"],
      "themes": ["Technology", "Sanctions"],
      "keyDevelopments": [
        { "title": "First major event of this story", "date": "Month Day", "description": "Optional 1-sentence detail" }
      ],
      "articleIds": ["article-id-that-started-this"]
    }
  ]
}`;
}

export async function processClusteringBatchWithAI(
  batch,
  activeClusters,
  estimatedTokens = 0,
) {
  const prompt = buildClusteringPrompt(batch, activeClusters);

  await waitForCapacity(estimatedTokens);

  return requestAI(primaryConfig, prompt);
}
