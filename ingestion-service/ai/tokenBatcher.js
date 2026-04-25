import { get_encoding } from "tiktoken";

const DEFAULT_CONFIG = {
  maxRequestTokens: parseInt(process.env.AI_MAX_REQUEST_TOKENS) || 3500,
  maxArticleTokens: parseInt(process.env.AI_MAX_ARTICLE_TOKENS) || 500,
  reservedOutputTokens: parseInt(process.env.AI_RESERVED_OUTPUT_TOKENS) || 800,
};

// Safety multiplier to account for the tokenizer gap between cl100k_base (used here)
// and Llama's native tokenizer (used by Groq). Llama's tokenizer is less efficient,
// producing ~30-50% more tokens for the same text. This multiplier inflates estimates
// so the rate limiter can pace API calls accurately.
const TOKEN_MULTIPLIER = parseFloat(process.env.AI_TOKEN_MULTIPLIER) || 1.4;

// cl100k_base is an OpenAI tokenizer — it does NOT match Llama's tokenizer exactly,
// but it's close enough for batch composition. The TOKEN_MULTIPLIER above compensates
// for the gap when reporting estimates to the rate limiter.
const enc = get_encoding("cl100k_base");

export function countTokens(text = "") {
  try {
    return enc.encode(text).length;
  } catch (err) {
    console.error("Token count error:", err);
    return 0;
  }
}

export function truncateByTokens(text = "", maxTokens = 500) {
  if (!text) return "";
  const tokens = enc.encode(text);
  if (tokens.length <= maxTokens) return text;
  
  const truncated = tokens.slice(0, maxTokens);
  return new TextDecoder().decode(enc.decode(truncated));
}

export function prepareArticle(article, config = DEFAULT_CONFIG) {
  // Combine title, source, and content to ensure we capture the most important info
  const fullText = [
    `Title: ${article.title}`,
    `Source: ${article.source} (Country: ${article.sourceCountry || 'unknown'})`,
    `Published: ${article.publishedAt}`,
    `Content: ${article.contentSnippet}`
  ].filter(Boolean).join("\n");

  const truncatedContent = truncateByTokens(
    fullText,
    config.maxArticleTokens
  );

  return {
    ...article,
    truncatedContent: truncatedContent,
    tokenCount: countTokens(truncatedContent),
  };
}

export function createNextBatch(articles, systemPromptTokens = 0, config = DEFAULT_CONFIG) {
  const batch = [];
  let currentTokens = systemPromptTokens + config.reservedOutputTokens;
  const remainingArticles = [...articles];

  while (remainingArticles.length > 0) {
    const rawArticle = remainingArticles[0];
    const article = prepareArticle(rawArticle, config);

    // If single article itself is too large (shouldn't happen with truncation, but safe check)
    if (article.tokenCount + systemPromptTokens + config.reservedOutputTokens > config.maxRequestTokens) {
        console.warn(`⚠️ Article too large even after truncation, skipping: ${article.title}`);
        remainingArticles.shift();
        continue;
    }

    if (currentTokens + article.tokenCount > config.maxRequestTokens) {
        // We've hit the limit, stop adding to this batch
        break;
    }

    batch.push(article);
    currentTokens += article.tokenCount;
    remainingArticles.shift();
  }

  return {
    batch,
    remainingArticles,
    // Raw cl100k estimate (for logging)
    rawEstimatedTokens: currentTokens,
    // Inflated estimate accounting for Llama tokenizer gap (for rate limiter)
    estimatedTokens: Math.ceil(currentTokens * TOKEN_MULTIPLIER),
  };
}

