import pLimit from 'p-limit';

const limit = pLimit(parseInt(process.env.AI_CONCURRENCY_LIMIT) || 3);

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
  const articlesContext = articles.map((a, i) => `
[ARTICLE ${i + 1}]
- ID: ${a.id}
${a.truncatedContent}
`).join('\n');

  return `You are a geopolitical news analyst. Process the following batch of articles and return ONLY valid JSON.

ARTICLES:
${articlesContext}

TASK:
For EACH article, do the following:
1. Categorize into 1-3 topics: geopolitics, technology, bangladesh, economy, environment, health, other
2. Extract named entities (countries, organizations, people) - max 10
3. Score sentiment: -1.0 (very negative) to +1.0 (very positive)
4. Note any detectable bias or perspective (e.g., "Western-centric", "state-media tone")
5. List countries whose perspective is represented (ISO codes if possible)

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
      "perspectiveCountries": ["CN", "US"]
    }
  ]
}`;
}

async function requestAI(config, prompt, retries = 0) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), parseInt(process.env.AI_TIMEOUT_MS) || 30000);

    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Global News Aggregator',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' }, // Force JSON output
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Handle rate limits
    if (res.status === 429) {
      const retryAfter = res.headers.get('retry-after') || 5;
      console.warn(`⚠️ Rate limited by ${config.provider}. Waiting ${retryAfter}s...`);
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      if (retries < (parseInt(process.env.AI_RETRY_ATTEMPTS) || 2)) {
        return requestAI(config, prompt, retries + 1);
      }
      throw new Error('Rate limit exceeded after retries');
    }

    if (!res.ok) throw new Error(`API Error ${res.status}: ${await res.text()}`);

    const data = await res.json();
    return {
      content: data.choices[0].message.content,
      model: config.model,
      provider: config.provider,
      tokensUsed: data.usage?.total_tokens || 0
    };
  } catch (err) {
    if (config === primaryConfig && fallbackConfig.apiKey) {
      console.warn(`⚠️ Primary (${primaryConfig.provider}) failed, switching to fallback (${fallbackConfig.provider})... Error: ${err.message}`);
      return requestAI(fallbackConfig, prompt, 0);
    }
    throw err;
  }
}

export function processBatchWithAI(batch) {
  const prompt = buildBatchPrompt(batch);
  return limit(() => requestAI(primaryConfig, prompt));
}
