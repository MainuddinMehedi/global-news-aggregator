import { waitForCapacity, recordUsage, logHeaders } from "./rateLimiter.js";
import { ALLOWED_CATEGORIES } from "./categories.js";
import { countTokens, TOKEN_MULTIPLIER } from "./tokenBatcher.js";

// Clustering responses are larger (assignments + cluster updates + new clusters)
// vs enrichment (categories + entities + sentiment per article).
const RESERVED_CLUSTERING_OUTPUT_TOKENS = parseInt(process.env.AI_RESERVED_CLUSTERING_OUTPUT_TOKENS) || 1500;

const primaryConfig = {
  baseUrl: process.env.GROQ_BASE_URL,
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.AI_INGESTION_MODEL,
  provider: "groq",
};

const fallbackConfig = {
  baseUrl: process.env.GROQ_BASE_URL,
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.AI_INGESTION_FALLBACK_MODEL,
  provider: "groq",
};

export function buildBatchPrompt(articles) {
  const articlesContext = articles
    .map(
      (a, i) => `
[ARTICLE ${i + 1}]
- Ref: ${a.aiRef}
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
   Map culture, education, human rights, religion, and migration to "society".
   Map crime, courts, terrorism, and military operations to "security".
   Map climate, disasters, pollution, and public-health environment stories to "environment".
   Map sports and entertainment stories to "other" unless they have a clear political, economic, or security angle.
   Use "other" if nothing fits. Do NOT invent new category names.
2. Extract named entities (countries, organizations, people) - max 10
3. Score sentiment: -1.0 (very negative) to +1.0 (very positive)
4. Note any detectable bias or perspective (e.g., "Western-centric", "state-media tone")
5. Classify bias category: exactly one of "Western", "Eastern", "Non-Western", "Neutral"
6. List countries whose perspective is represented (ISO codes if possible)

OUTPUT FORMAT (strict JSON, no markdown):
You must return a JSON object with a single key "results", which is an array of objects.
Each object MUST correspond to the article in the same order, and include the article's exact "ref".
Use only article refs listed above. Do not invent refs.

{
  "results": [
    {
      "ref": "article_1",
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
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
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
 * @param {number} estimatedTokens - Estimated total tokens (from tokenBatcher, with multiplier).
 *   If provided (> 0), this external estimate is used. Otherwise, falls back to
 *   counting the prompt tokens directly (slower but always accurate).
 */
export async function processBatchWithAI(batch, estimatedTokens = 0) {
  const prompt = buildBatchPrompt(batch);

  // Use the external estimate if available, otherwise self-calculate from the prompt
  const tokensForCapacity = estimatedTokens > 0
    ? estimatedTokens
    : Math.ceil(countTokens(prompt) * TOKEN_MULTIPLIER);

  await waitForCapacity(tokensForCapacity);

  return requestAI(primaryConfig, prompt);
}

export function buildClusteringPrompt(
  articles,
  activeClusters,
  lifecycleConfig = {},
) {
  const { low = 10, medium = 21, high = 35, critical = 60 } = lifecycleConfig;

  const articlesContext = articles
    .map(
      (a, i) => `
[ARTICLE ${i + 1}]
- Ref: ${a.aiRef}
- Title: ${a.title}
- Source: ${a.source || "Unknown"}
- Source Country: ${a.sourceCountry || "Unknown"}
- Published At: ${a.publishedAt ? new Date(a.publishedAt).toISOString() : "Unknown"}
- Summary: ${a.contentSnippet}
- Categories: ${(a.categories || []).join(", ") || "Unknown"}
- Entities: ${(a.entities || []).join(", ") || "Unknown"}
- Perspective Countries: ${(a.perspectiveCountries || []).join(", ") || "Unknown"}
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
- Ref: ${c.aiRef}
- Title: ${c.title}
- Summary: ${c.summary}
- Article Count: ${c.articleCount || 0}
- Source Count: ${c.sourceCount || 0}
- Last Activity: ${c.lastActivityAt ? new Date(c.lastActivityAt).toISOString() : "Unknown"}
- Updated At: ${c.updatedAt ? new Date(c.updatedAt).toISOString() : "Unknown"}
- Impact: ${c.impact || "Unknown"}
- Status: ${c.status || "Unknown"}
- Why It Matters: ${c.whyItMatters || "Unknown"}
- Regions: ${(c.regions || []).join(", ") || "Unknown"}
- Themes: ${(c.themes || []).join(", ") || "Unknown"}
- Key Developments: ${JSON.stringify(c.keyDevelopments || [])}
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
- If it matches an active cluster, assign its clusterRef.
- If it's a completely new, major geopolitical event, propose a new cluster. (Do not create new clusters for minor, isolated events; those can be assigned to null/unclustered).
- For every existing cluster that receives one or more new articles, update the cluster's intelligence metadata so the dossier reflects the latest reporting.
- Use only articleRef and clusterRef values listed above. Do not invent refs or return database IDs.
- Return one assignment per article, in the same order as NEW ARTICLES TO CLUSTER.

STORY VS TOPIC RUBRIC:
- A story cluster is a specific evolving event, policy move, crisis, negotiation, legal case, military operation, election episode, market shock, or named investigation.
- Do NOT cluster articles together just because they share a broad topic, country, person, sector, or long-running background issue.
- Same country + same theme is not enough on its own. However, if the article is clearly covering the same named event, policy, crisis, or operation from a different regional or cultural perspective, assign it to the existing cluster — multi-perspective coverage of the same development is the goal. A new cluster is only warranted when the article describes a genuinely separate event or a new distinct development.
- Prefer null/unclustered for minor isolated articles or weak matches.
- Create a new cluster when the article is a major development and no existing cluster has the same concrete storyline.
- Reuse an older cluster only when the new article clearly continues that exact storyline; otherwise create a new cluster or leave it unclustered.
- If a cluster has had no activity for more than ${critical} days (CRITICAL), ${high} days (HIGH), ${medium} days (MEDIUM), or ${low} days (LOW), require an exceptionally strong match — same named event, same actors, direct causal continuation — before assigning to it. When in doubt, leave unclustered or create a new cluster.
- Avoid duplicate clusters. If a proposed new story is substantially the same as an active cluster, assign the article to that existing cluster instead.
- For each assignment, include a confidence score from 0 to 1 and a short reason.

For NEW clusters, you MUST generate the following intelligence metadata:
- impact: One of "CRITICAL", "HIGH", "MEDIUM", "LOW"
- status: One of "ESCALATING", "DEVELOPING", "STABLE", "RESOLVING"
- whyItMatters: A sharp, 1-line analysis of the geopolitical or economic implications of this story.
- regions: Array of affected regions/countries (e.g. ["Middle East", "USA"])
- themes: Array of topics (e.g. ["Trade War", "Elections"])

For EXISTING cluster updates:
- Preserve the original story identity unless the new reporting clearly broadens or narrows the story.
- Rewrite summary to include the newest meaningful development.
- Update impact/status only when the new reporting changes the severity or trajectory.
- Merge regions and themes; keep them concise.
- keyDevelopments: Return ONLY developments from the NEW ARTICLES in this batch that are not already captured in the cluster's existing keyDevelopments above. If nothing is genuinely new, return an empty array []. Do NOT rewrite, rephrase, or repeat existing developments.

OUTPUT FORMAT (strict JSON, no markdown):
{
  "assignments": [
    {
      "articleRef": "article_1",
      "clusterRef": "cluster_1",
      "confidence": 0.86,
      "reason": "Same named negotiation and latest proposal continues the existing story."
    },
    {
      "articleRef": "article_2",
      "clusterRef": null,
      "confidence": 0.35,
      "reason": "Related topic but no concrete shared storyline with active clusters."
    }
  ],
  "clusterUpdates": [
    {
      "clusterRef": "cluster_1",
      "title": "Updated title only if needed",
      "summary": "Updated 1-2 sentence story summary reflecting the newest reporting",
      "timeWindow": "Updated time window if needed",
      "impact": "HIGH",
      "status": "ESCALATING",
      "whyItMatters": "Updated 1-line geopolitical or economic implication.",
      "regions": ["China", "USA"],
      "themes": ["Technology", "Sanctions"],
      "keyDevelopments": [] // NEW ones only — empty if nothing new
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
      "articleRefs": ["article_3"]
    }
  ]
}`;
}

export async function processClusteringBatchWithAI(
  batch,
  activeClusters,
  lifecycleConfig = {},
) {
  const prompt = buildClusteringPrompt(batch, activeClusters, lifecycleConfig);

  // Self-calculate: count actual prompt tokens + output reserve, apply multiplier.
  // Clustering prompts are large and variable (depends on number of active clusters),
  // so we always count the real prompt rather than relying on external estimates.
  const rawInputTokens = countTokens(prompt);
  const estimatedTokens = Math.ceil((rawInputTokens + RESERVED_CLUSTERING_OUTPUT_TOKENS) * TOKEN_MULTIPLIER);

  await waitForCapacity(estimatedTokens);

  return requestAI(primaryConfig, prompt);
}
