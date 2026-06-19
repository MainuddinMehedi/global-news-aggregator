# 🔐 Repository Secrets

These must be added under the **Secrets** tab.

| Secret Name           | Purpose                         | Example / Note                                       |
| --------------------- | ------------------------------- | ---------------------------------------------------- |
| `DATABASE_URL`        | Prisma DB Connection            | `postgresql://postgres...`                           |
| `REVALIDATE_SECRET`   | Next.js Cache Invalidation      | Your secure random hash                              |
| `MISTRAL_API_KEY`     | Primary ingestion pipeline      | `TsmxEsmy0PfR7...`                                   |
| `GROQ_API_KEY`        | Fast fallback / UI pipeline     | `gsk_SGYVUpUYPc...`                                  |
| `GEMINI_API_KEY`      | Summarization & Overview        | `AIzaSyDQAytgo0...`                                  |
| `BRAVE_API_KEY`       | Live scanning for locked topics | _(Required if you use the Brave search integration)_ |
| `DISCORD_WEBHOOK_URL` | Notifications                   | _(Optional)_                                         |
| `TELEGRAM_BOT_TOKEN`  | Notifications                   | _(Optional)_                                         |
| `TELEGRAM_CHAT_ID`    | Notifications                   | _(Optional)_                                         |

_(Note: `GITHUB_TOKEN` is already injected automatically by GitHub Actions)._

---

### ⚙️ Repository Variables

These must be added under the **Variables** tab. I have provided the default values from your `.env.example`.

#### 1. Endpoints & Models

|Variable Name|Default Value|
|---|---|
|`NEXT_PUBLIC_API_URL`|`https://your-production-domain.com/api`|
|`MISTRAL_BASE_URL`|`https://api.mistral.ai/v1`|
|`GROQ_BASE_URL`|`https://api.groq.com/openai/v1`|
|`GEMINI_BASE_URL`|`https://generativelanguage.googleapis.com/v1beta/openai`|
|`AI_PIPELINE_MODEL`|`mistral-small-2506`|
|`AI_PIPELINE_FALLBACK_MODEL`|`meta-llama/llama-4-scout-17b-16e-instruct`|
|`AI_UTILITY_FALLBACK_MODEL`|`gemini-3.1-flash-lite`|
|`AI_SUMMARY_MODEL`|`gemma-4-31b`|

#### 2. Mistral Performance (Primary)

|Variable Name|Default Value|
|---|---|
|`AI_MISTRAL_TPM_LIMIT`|`2250000`|
|`AI_MISTRAL_RPM_LIMIT`|`60`|
|`AI_MISTRAL_CONCURRENCY`|`5`|
|`AI_MISTRAL_BATCH_SIZE`|`10`|

#### 3. Groq Performance (Fallback)

|Variable Name|Default Value|
|---|---|
|`AI_GROQ_TPM_LIMIT`|`25000`|
|`AI_GROQ_RPM_LIMIT`|`28`|
|`AI_GROQ_CONCURRENCY`|`1`|
|`AI_GROQ_BATCH_SIZE`|`5`|

#### 4. Global Settings

|Variable Name|Default Value|
|---|---|
|`AI_TOKEN_MULTIPLIER`|`1.4`|
|`AI_TIMEOUT_MS`|`60000`|
|`AI_RETRY_ATTEMPTS`|`2`|

#### 5. Clustering Engine (Optional Overrides)

These variables are pulled by the `cluster.yml` workflow. _If you do not configure them in GitHub Variables, the Node script simply falls back to its hardcoded internal defaults._

- `CLUSTER_ASSIGNMENT_MIN_CONFIDENCE`
- `AI_RESERVED_CLUSTERING_OUTPUT_TOKENS`