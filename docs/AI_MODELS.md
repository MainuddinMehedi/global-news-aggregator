# AI Model Strategy Guide

This document defines the AI model selection and strategy for the Global News Aggregator. It serves as the source of truth for developers and AI agents to understand which models are used for specific tasks, why they were chosen, and how rate limits are managed across providers.

## Core Strategy

To maintain a high-performance, cost-effective (free tier), and resilient system, we utilize a multi-provider strategy:

- **Mistral AI**: Used as the primary engine for high-throughput background tasks (Article Enrichment, Story Clustering) and Relevance Scoring due to its extremely high free-tier rate limits (2.25M TPM).
- **Groq**: Used as a high-speed fallback provider for ingestion/clustering tasks (using Llama 4 Scout 17B) and primary for interactive UI modals where sub-second latency is critical.
- **Google AI Studio**: Used for large-context tasks (Summarization) and specialized features (Voice, Grounding) where high Token-Per-Minute (TPM) or specific capabilities are needed.
- **GitHub Models**: Used exclusively for the **AI Chat Interface** to provide access to high-reasoning models (Grok, DeepSeek, GPT-4o) that are not available on other free tiers.

_Note: **OpenRouter** is currently deprioritized. While present in env vars, its 50 req/day limit offers minimal value compared to Groq/Google/GitHub and is reserved only as a theoretical last-resort fallback._

---

## Model Assignment Map

| Job                     | Primary Model              | Provider | Key Rationale                                           |
| :---------------------- | :------------------------- | :------- | :------------------------------------------------------ |
| **Article Enrichment**  | `mistral-small-2506`       | Mistral  | 2.25M TPM limit, high-quality dynamic bias/entities.    |
| **Enrichment Fallback** | `llama-4-scout-17b`        | Groq     | 30K TPM; handles batch sizes that 8B cannot.            |
| **Story Clustering**    | `mistral-small-2506`       | Mistral  | Large TPM headroom prevents rate limit exhaustion.      |
| **Clustering Fallback** | `llama-4-scout-17b`        | Groq     | Shared fallback pipeline with enrichment.               |
| **Topic Refinement**    | `openai/gpt-oss-20b`       | Groq     | Extremely fast (~1K t/s) for interactive UI modals.     |
| **Refinement Fallback** | `ministral-8b-2512`        | Mistral  | 625K TPM, excellent 8B quality backup.                  |
| **Relevance Scoring**   | `mistral-small-2506`       | Mistral  | Shared quota with ingestion; avoids Groq TPM limits.     |
| **On-Demand Summary**   | `gemma-4-31b`              | Google   | Unlimited TPM; fits hundreds of findings in context.    |
| **Findings Overview**   | `gemma-4-31b`              | Google   | Post-scan topic synthesis; separate from Groq pipeline. |
| **Summary Fallback**    | `gemini-3.1-flash-lite`    | Google   | 500 RPD backup with high context window.                |
| **AI Chat Interface**   | `groq/compound-mini`       | Groq     | Built-in web search and tool use capability.            |
| **Chat Guard**          | `llama-prompt-guard-2-86m` | Groq     | Specialized low-latency safety model.                   |
| **Voice Session**       | `Gemini 3 Flash Live`      | Google   | Native multi-modal/audio streaming.                     |

---

## Provider Rate Limit Constraints (Free Tier)

### Mistral AI
*Privacy settings: Data training opt-out enabled.*

| Model Family         | TPM        | RPS   | Context Window |
| :------------------- | :--------- | :---- | :------------- |
| `mistral-small-2506` | 2,250,000  | 5.00  | 256K tokens    |
| `ministral-3b-2512`  | 1,300,000  | 12.50 | 128K tokens    |
| `ministral-8b-2512`  | 625,000    | 3.13  | 128K tokens    |
| `codestral-2508`     | 625,000    | 2.08  | 256K tokens    |
| `open-mistral-nemo`  | 500,000    | 0.50  | 128K tokens    |

### Groq

| Model Family         | TPM | RPM | RPD |
| :------------------- | :-- | :-- | :-- |
| `llama-4-scout-17b`  | 30K | 30  | 1K  |
| `llama-3.3-70b`      | 12K | 30  | 1K  |
| `openai/gpt-oss-20b` | 8K  | 30  | 1K  |
| `groq/compound`      | 70K | 30  | 250 |

### Google AI Studio

| Model Family            | TPM           | RPM       | RPD       |
| :---------------------- | :------------ | :-------- | :-------- |
| `gemma-4-26b/31b`       | **Unlimited** | 15        | 1.5K      |
| `gemini-3.1-flash-lite` | 250K          | 15        | 500       |
| `gemini-2.5-flash`      | 250K          | 5         | 20        |
| `Gemini 3 Flash Live`   | 65K           | Unlimited | Unlimited |

### GitHub Models

| Tier     | RPM | RPD | Token Limit (Input) |
| :------- | :-- | :-- | :------------------ |
| **Low**  | 15  | 150 | 8K tokens / req     |
| **High** | 10  | 50  | 8K tokens / req     |

_Critical Constraint: The **8K input token cap** and low RPD make GitHub Models unsuitable for background ingestion or clustering. Use only for interactive chat._

---

## Detailed Job Implementation

### 1. Ingestion Pipeline (Enrichment & Clustering)

- **Model**: `mistral-small-2506` (Primary), `meta-llama/llama-4-scout-17b-16e-instruct` (Fallback)
- **Strategy**: Mistral's high TPM capacity (2.25M) allows processing background ingestion and story clustering with almost zero rate limit friction. We set `AI_BATCH_SIZE=5` (default) to process articles in highly resilient, small chunks.
- **Dynamic Usage**: The rate limiter window logs actual token consumption. If Mistral hits token or rate limits, the system dynamically switches to Groq's `llama-4-scout-17b` fallback config.

### 2. Topic Management

- **Refinement (Step 3 Modal)**: Uses `openai/gpt-oss-20b` as primary and `ministral-8b-2512` as fallback to maintain high semantic reasoning while scaling limits.
- **Relevance Scoring**: Runs every 2 hours via the Topics Scanner. Uses the Mistral API as primary (`mistral-small-2506`) to completely bypass Groq's strict RPM limits.

### 3. User-Facing Summaries - during topic deletion

- **Model**: `gemma-4-31b`
- **Context**: Often involves 50-200 article snippets (~20K - 40K tokens).
- **Rationale**: Google's "Unlimited TPM" on Gemma 4 is essential here. Groq would rate-limit a single large summary request immediately.

---

## AI Chat Interface (Model Picker)

The frontend chat interface should offer the following options to users:

| Provider    | Display Name              | Model ID                                  | Tag          | Use Case                        |
| :---------- | :------------------------ | :---------------------------------------- | :----------- | :------------------------------ |
| **Groq**    | **Compound (Web Search)** | `groq/compound`                           | 🔍 Search    | Current events, fact-checking.  |
| **Groq**    | **Compound Mini**         | `groq/compound-mini`                      | ⚡ Fast      | Default, quick questions.       |
| **Groq**    | **GPT OSS 120B**          | `openai/gpt-oss-120b`                     | 🧠 Reasoning | Capable open reasoning.         |
| **Groq**    | **GPT OSS 20B**           | `openai/gpt-oss-20b`                      | ⚡ Fast      | Rapid factual Q&A.              |
| **Groq**    | **Llama 3.3 70B**         | `llama-3.3-70b-versatile`                 | ⚖️ Balanced  | Standard high-quality chat.     |
| **Mistral** | **Mistral Small 3**       | `mistral-small-2506`                      | ⚖️ Balanced  | Smart analysis, high limits.    |
| **Mistral** | **Ministral 8B**          | `ministral-8b-2512`                       | 🏎️ Fast      | High-performance edge chat.     |
| **Google**  | **Gemini 2.5 Flash Lite** | `gemini-2.5-flash-lite`                   | 📄 Context   | Summarizing long pasted text.   |
| **Google**  | **Gemini 2.5 Flash**      | `gemini-2.5-flash`                        | 🏎️ Fast      | Multimodal and fast.            |
| **Google**  | **Gemma 4 31B**           | `gemma-4-31b-it`                          | 🧠 Reasoning | Deep article analysis.          |
| **GitHub**  | **DeepSeek V3 (0324)**    | `deepseek/DeepSeek-V3-0324`               | ⚡ Fast      | SOTA 671B MoE (Writing, Search).  |
| **GitHub**  | **DeepSeek R1 (0528)**    | `deepseek/DeepSeek-R1-0528`               | 🧠 Reasoning | Upgraded reasoning (87.5% AIME).  |
| **GitHub**  | **Llama 4 Scout**         | `meta/Llama-4-Scout-17B-16E-Instruct`     | ⚡ Scout     | 10M context, natively multimodal. |
| **GitHub**  | **Llama 4 Maverick**      | `meta/Llama-4-Maverick-17B-128E-Instruct` | 🧠 Maverick  | 1M context, high-performance MoE. |
| **GitHub**  | **GPT-4.1**               | `openai/gpt-4.1`                          | 🧠 Reasoning | 1M context, superior coding.    |

---

## Future Roadmap

- **Multilingual Support**: Implement `qwen/qwen3-32b` for superior Bengali and non-Western source processing.
- **Semantic Search**: Integrate `Gemini Embedding 1` with Supabase `pgvector` to replace keyword-based matching.
- **Prompt Injection**: Deploy `llama-prompt-guard-2-86m` as a middleware for the chat API.
