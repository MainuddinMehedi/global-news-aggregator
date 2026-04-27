# Rate-Limit-Aware AI Processing & Token Estimation Fix

## Problem

The Groq dashboard shows the last run used **16.6K total tokens** (13.9K input + 2.8K output) against a **12K TPM limit** — 139% consumed, exceeding the rate limit.

### Root Cause Analysis

Two compounding issues:

**1. Tokenizer mismatch — estimates are ~2× too low**

The batcher uses `cl100k_base` (OpenAI's GPT-3.5/4 tokenizer), but Groq runs Llama models which use a different tokenizer. Llama's tokenizer is **less efficient** — the same text produces ~30-50% more tokens. On top of that, the batcher only counts article content tokens, NOT the ~300-token instruction template that `buildBatchPrompt()` wraps around them. Combined, the estimated 2,026 tokens/batch actually becomes ~7,000-8,300 real tokens on Groq.

**2. No TPM pacing — both batches fire in the same minute**

The current 2-second delay between batches is nowhere near enough. Two batches land in the same 60-second TPM window:
- Batch 1: ~8.3K tokens (input + output)
- Batch 2: ~8.3K tokens
- Total: ~16.6K vs 12K limit → **rate limited**

## Proposed Changes

### 1. Model Switch

Switch from the 70B model to **Llama 4 Scout** — a newer, faster model with drastically better rate limits.

#### New AI Provider Strategy

| Role | Model | Provider | TPM | TPD | RPD | Purpose |
|---|---|---|---|---|---|---|
| **Primary** | `llama-4-scout-17b-16e-instruct` | Groq | 30K | 500K | 1K | Batch article processing |
| **Fallback** | `llama-3.1-8b-instant` | Groq | 6K | 500K | 14.4K | Fallback if Scout hits RPD |
| **Reserved** | Any model via OpenRouter | OpenRouter | — | — | 50/day | Future: chat interface, article summary/analyze buttons on news cards |

> [!NOTE]
> OpenRouter is intentionally kept out of the ingestion fallback chain. Its 50 req/day free tier is reserved for high-value frontend interactions (on-demand article summarization, deep analysis) where calling a frontier model is justified. The ingestion pipeline stays entirely on Groq.

#### [MODIFY] [.env](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/.env)

```diff
 # AI Processing — Ingestion Pipeline
-AI_PRIMARY_PROVIDER=groq
-AI_PRIMARY_MODEL=llama-3.3-70b-versatile
-AI_PRIMARY_BASE_URL=https://api.groq.com/openai/v1
-AI_PRIMARY_API_KEY=<key>
+AI_PRIMARY_PROVIDER=groq
+AI_PRIMARY_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
+AI_PRIMARY_BASE_URL=https://api.groq.com/openai/v1
+AI_PRIMARY_API_KEY=<key>

-AI_FALLBACK_PROVIDER=openrouter
-AI_FALLBACK_MODEL=meta-llama/llama-3.1-8b-instruct
-AI_FALLBACK_BASE_URL=https://openrouter.ai/api/v1
-AI_FALLBACK_API_KEY=<key>
+AI_FALLBACK_PROVIDER=groq
+AI_FALLBACK_MODEL=llama-3.1-8b-instant
+AI_FALLBACK_BASE_URL=https://api.groq.com/openai/v1
+AI_FALLBACK_API_KEY=<same groq key>

+# AI Processing — Frontend (reserved for future use)
+AI_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
+AI_OPENROUTER_API_KEY=<key>
+AI_OPENROUTER_MODEL=<choose per feature — e.g. claude, gpt-4o, etc.>
```

---

### 2. Token Estimation Fix

#### [MODIFY] [tokenBatcher.js](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/ingestion-service/ai/tokenBatcher.js)

- Add a **safety multiplier** (default `1.4`) via `AI_TOKEN_MULTIPLIER` env var to account for the cl100k_base → Llama tokenizer gap
- Remove the incorrect comment "cl100k_base is compatible with Llama 3.3" and document the multiplier rationale
- Apply the multiplier to the `estimatedTokens` value returned by `createNextBatch` (used by the rate limiter for pacing) — batch composition logic stays unchanged
- `maxArticleTokens` stays at `500`, `reservedOutputTokens` stays at `800` — no changes needed since the rate limiter handles pacing using actual Groq response data

---

### 3. Minute-Window Rate Limiter

#### [NEW] [rateLimiter.js](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/ingestion-service/ai/rateLimiter.js)

A **sliding-window rate limiter** that tracks tokens and requests per minute:

```js
// Configuration (from env)
const TPM_LIMIT = parseInt(process.env.AI_TPM_LIMIT) || 25000;  // safe margin under 30K
const RPM_LIMIT = parseInt(process.env.AI_RPM_LIMIT) || 28;     // safe margin under 30
```

Behavior:
- Maintains a log of `{ timestamp, tokens }` entries within a rolling 60-second window
- Before each batch: check if `windowTokens + estimatedBatchTokens > TPM_LIMIT` or `windowRequests + 1 > RPM_LIMIT`
- If it would exceed: calculate seconds until oldest entry exits the window, **wait** that long, then recheck
- Log the wait: `⏳ Rate limit: waiting 42s for TPM reset (24,800/25,000 used)...`
- After each AI response: record **actual tokens** (from Groq's `usage.total_tokens`) into the window

Also reads Groq's rate limit headers for awareness:
- `x-ratelimit-remaining-tokens` — remaining TPM from Groq's perspective
- `x-ratelimit-reset-tokens` — time until TPM resets

#### [MODIFY] [client.js](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/ingestion-service/ai/client.js)

- Import and use the rate limiter:
  - Call `await rateLimiter.waitForCapacity(estimatedTokens)` before sending each request
  - After response: call `rateLimiter.recordUsage(actualTokens)` with the real token count
  - Parse and log `x-ratelimit-remaining-tokens` and `x-ratelimit-reset-tokens` from response headers
- **Remove `p-limit`** concurrency limiter — batches must be sequential now (parallel batches defeat rate limiting)
- Return `estimatedTokens` from `processBatchWithAI` so the processor can pass it to the rate limiter

#### [MODIFY] [processor.js](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/ingestion-service/ai/processor.js)

- Remove the hardcoded `2000ms` delay between batches — the rate limiter handles pacing
- Pass estimated token count from `createNextBatch` to the AI client for pre-checking

---

### 4. CLI Flags for Ingestion Modes

#### [MODIFY] [index.js](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/ingestion-service/index.js)

Add simple `process.argv` parsing:

| Flag | Effect |
|---|---|
| `--skip-ai` | Ingest raw articles only, skip AI processing entirely |
| `--ai-limit=N` | Process at most N articles through AI, skip the rest |

Usage:
```bash
# First bulk run — ingest everything, no AI
node ingestion-service/index.js --skip-ai

# Process only 20 articles through AI
node ingestion-service/index.js --ai-limit=20

# Normal run — process everything with rate limiting
node ingestion-service/index.js
```

When `--skip-ai` is set, the `aiProcessor.add()` call is skipped entirely. When `--ai-limit=N` is set, a counter tracks how many articles have been queued and stops adding after N. All articles are still saved as `RawArticle` regardless.

#### [NEW] [processBacklog.js](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/ingestion-service/processBacklog.js)

A standalone script to process **unprocessed RawArticles** through AI:

```bash
# Process up to 50 backlogged articles
node ingestion-service/processBacklog.js --limit=50
```

Queries `RawArticle` rows that have no linked `ProcessedArticle`, feeds them through the AI processor with rate limiting. Useful after a `--skip-ai` bulk run.

---

### 5. Environment Config Updates

#### [MODIFY] [.env.example](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/.env.example)

Add/update config vars:

```env
# AI Processing — Ingestion Pipeline (Groq)
AI_PRIMARY_PROVIDER=groq
AI_PRIMARY_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
AI_PRIMARY_BASE_URL=https://api.groq.com/openai/v1
AI_PRIMARY_API_KEY=your-groq-key

AI_FALLBACK_PROVIDER=groq
AI_FALLBACK_MODEL=llama-3.1-8b-instant
AI_FALLBACK_BASE_URL=https://api.groq.com/openai/v1
AI_FALLBACK_API_KEY=your-groq-key

# AI Processing — Frontend (OpenRouter, reserved for future use)
AI_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
AI_OPENROUTER_API_KEY=your-openrouter-key
AI_OPENROUTER_MODEL=choose-per-feature

# Rate Limiting (tune to your Groq plan)
AI_TPM_LIMIT=25000          # tokens per minute budget (Scout = 30K, use 25K for safety)
AI_RPM_LIMIT=28             # requests per minute budget (Scout = 30, use 28 for safety)
AI_TOKEN_MULTIPLIER=1.4     # safety multiplier for cl100k_base → Llama tokenizer gap

# Batch Processing
AI_BATCH_SIZE=5
AI_CONCURRENCY_LIMIT=1      # must be 1 for rate limiting to work
AI_TIMEOUT_MS=30000
AI_RETRY_ATTEMPTS=2
AI_MAX_REQUEST_TOKENS=3500
AI_MAX_ARTICLE_TOKENS=500
AI_RESERVED_OUTPUT_TOKENS=800
```

---

## Summary: Token Math Before vs After

| Metric | Before (broken) | After (fixed) |
|---|---|---|
| Model | llama-3.3-70b (12K TPM) | **Scout 17B (30K TPM)** |
| Token estimate per batch | ~2,000 (way off) | ~5,500 (with 1.4× multiplier) |
| Actual tokens per batch | ~8,300 | ~8,300 (unchanged) |
| TPM budget | None | 25,000 |
| Batches per minute | Unlimited (2s gap) | **~3** (rate limiter paces) |
| 10 new articles (2 batches) | 💥 16.6K in one burst, 139% over | ✅ 16.6K fits in one minute (under 25K) |
| 100 new articles (20 batches) | 💥 Instant rate limit cascade | ✅ ~7 minutes, fully paced |
| Daily capacity | ~12 batches (100K TPD ÷ 8.3K) | **~60 batches = ~300 articles/day** |

---

## Files Changed Summary

| File | Action | What changes |
|---|---|---|
| `.env` / `.env.example` | MODIFY | Model switch, new rate limit vars, OpenRouter reserved |
| `ai/tokenBatcher.js` | MODIFY | Safety multiplier, lower article tokens, higher output reserve |
| `ai/rateLimiter.js` | **NEW** | Sliding-window TPM/RPM tracker with auto-wait |
| `ai/client.js` | MODIFY | Use rate limiter, remove p-limit, parse rate limit headers |
| `ai/processor.js` | MODIFY | Remove 2s delay, pass token estimates to client |
| `index.js` | MODIFY | `--skip-ai` and `--ai-limit=N` flags |
| `processBacklog.js` | **NEW** | Standalone script to process unprocessed articles |

---

## Verification Plan

### Automated Tests
1. Run `node ingestion-service/index.js --skip-ai` with all 7 sources — verify raw articles ingested, no AI calls
2. Run `node ingestion-service/processBacklog.js --limit=5` — verify 5 articles processed, rate limiter logs visible
3. Run `node ingestion-service/index.js --ai-limit=10` — verify only 10 articles go through AI
4. Check Groq dashboard: confirm TPM stays under 30K red line

### Manual Verification
- Console shows `⏳ Rate limit: waiting Xs...` messages when pacing is active
- Groq dashboard shows smooth token usage below the rate limit line
- Verify Scout model produces valid JSON with correct categories/entities/sentiment
