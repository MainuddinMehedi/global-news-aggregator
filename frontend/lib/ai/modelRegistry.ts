export type ProviderName = "groq" | "google" | "github" | "mistral";

export interface ModelCapabilities {
  supportsTools: boolean;
  supportsImages: boolean;
  supportsReasoning: boolean;
  supportsStreaming: boolean;
  supportsVision: boolean;
}

export interface ModelMetadata {
  id: string;
  label: string;
  provider: ProviderName;
  description: string;
  capabilities: ModelCapabilities;
  contextWindow: number;
  defaultResponseMode: "concise" | "descriptive";
  isActive: boolean;
  family?: string;
  tags?: string[];
}

export const MODEL_REGISTRY: ModelMetadata[] = [
  // ── GOOGLE PROVIDER (Best Quota & Context) ───────────────────────────────
  {
    id: "gemini-3.1-flash-lite",
    label: "Gemini 3.1 Flash Lite",
    provider: "google",
    description: "Google\u2019s fastest multimodal model with 1M context",
    family: "Gemini 3.1",
    tags: ["fast", "context", "vision", "reasoning"],
    capabilities: {
      supportsTools: true,
      supportsImages: true,
      supportsReasoning: true,
      supportsStreaming: true,
      supportsVision: true,
    },
    contextWindow: 1048576,
    defaultResponseMode: "concise",
    isActive: true,
  },
  {
    id: "gemma-4-31b-it",
    label: "Gemma 4 31B",
    provider: "google",
    description: "Large-context article analysis (Unlimited TPM)",
    family: "Gemma 4",
    tags: ["context", "summarization", "tools", "reasoning"],
    capabilities: {
      supportsTools: true,
      supportsImages: false,
      supportsReasoning: true,
      supportsStreaming: true,
      supportsVision: false,
    },
    contextWindow: 256000,
    defaultResponseMode: "descriptive",
    isActive: true,
  },
  {
    id: "gemma-4-26b-a4b-it",
    label: "Gemma 4 26B",
    provider: "google",
    description: "Efficient large-context analysis",
    family: "Gemma 4",
    tags: ["fast", "context", "tools", "reasoning"],
    capabilities: {
      supportsTools: true,
      supportsImages: false,
      supportsReasoning: true,
      supportsStreaming: true,
      supportsVision: false,
    },
    contextWindow: 256000,
    defaultResponseMode: "concise",
    isActive: true,
  },

  // ── MISTRAL PROVIDER ─────────────────────────────────────────────────────
  {
    id: "ministral-8b-2512",
    label: "Ministral 8B",
    provider: "mistral",
    description: "Mistral's lightweight edge model for ultra-low latency tasks",
    family: "Ministral",
    tags: ["fast", "edge"],
    capabilities: {
      supportsTools: true,
      supportsImages: false,
      supportsReasoning: false,
      supportsStreaming: true,
      supportsVision: false,
    },
    contextWindow: 128000,
    defaultResponseMode: "concise",
    isActive: true,
  },

  // ── GITHUB PROVIDER ──────────────────────────────────────────────────────
  {
    id: "github:openai/gpt-4o-mini",
    label: "GPT-4o mini",
    provider: "github",
    description: "Affordable, efficient model for diverse text and image tasks",
    family: "GPT-4",
    tags: ["reasoning", "multimodal", "multilingual"],
    capabilities: {
      supportsTools: true,
      supportsImages: true,
      supportsReasoning: true,
      supportsStreaming: true,
      supportsVision: true,
    },
    contextWindow: 131000,
    defaultResponseMode: "concise",
    isActive: true,
  },
  {
    id: "github:mistral-ai/mistral-medium-2505",
    label: "Mistral Medium 3",
    provider: "github",
    description: "SOTA versatile model for dialogue, reasoning, and vision",
    family: "Mistral",
    tags: ["reasoning", "multimodal", "vision"],
    capabilities: {
      supportsTools: true,
      supportsImages: true,
      supportsReasoning: true,
      supportsStreaming: true,
      supportsVision: true,
    },
    contextWindow: 128000,
    defaultResponseMode: "descriptive",
    isActive: true,
  },
  {
    id: "github:meta/Llama-4-Scout-17B-16E-Instruct",
    label: "Llama 4 Scout",
    provider: "github",
    description: "Meta's efficient MoE model with massive 10M context",
    family: "Llama 4",
    tags: ["fast", "massive-context", "multimodal", "tools"],
    capabilities: {
      supportsTools: true,
      supportsImages: true,
      supportsReasoning: false,
      supportsStreaming: true,
      supportsVision: true,
    },
    contextWindow: 10000000,
    defaultResponseMode: "descriptive",
    isActive: true,
  },
  {
    id: "github:meta/Llama-4-Maverick-17B-128E-Instruct-FP8",
    label: "Llama 4 Maverick",
    provider: "github",
    description: "High-performance MoE model with 1M context",
    family: "Llama 4",
    tags: ["balanced", "large-context", "multimodal", "tools"],
    capabilities: {
      supportsTools: true,
      supportsImages: true,
      supportsReasoning: false,
      supportsStreaming: true,
      supportsVision: true,
    },
    contextWindow: 1000000,
    defaultResponseMode: "descriptive",
    isActive: true,
  },

  // ── GROQ PROVIDER (Lower Priority due to context limits) ─────────────────
  {
    id: "groq/compound",
    label: "Compound",
    provider: "groq",
    description:
      "GPT-OSS 120B + Llama 4 Scout routed with built-in search, code, and browser tools (no external tool calling)",
    family: "Groq Compound",
    tags: ["builtin-tools", "reasoning", "multimodal"],
    capabilities: {
      supportsTools: false,
      supportsImages: true,
      supportsReasoning: true,
      supportsStreaming: true,
      supportsVision: true,
    },
    contextWindow: 131072,
    defaultResponseMode: "descriptive",
    isActive: true,
  },
  {
    id: "groq/compound-mini",
    label: "Compound Mini",
    provider: "groq",
    description:
      "GPT-OSS 120B + Llama 3.3 70B routed with built-in search, code, and browser tools (no external tool calling)",
    family: "Groq Compound",
    tags: ["fast", "builtin-tools", "reasoning"],
    capabilities: {
      supportsTools: false,
      supportsImages: false,
      supportsReasoning: true,
      supportsStreaming: true,
      supportsVision: false,
    },
    contextWindow: 131072,
    defaultResponseMode: "concise",
    isActive: true,
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    provider: "groq",
    description: "More capable open model on Groq, with web search",
    family: "GPT-OSS",
    tags: ["reasoning", "large", "tools", "search"],
    capabilities: {
      supportsTools: true,
      supportsImages: false,
      supportsReasoning: true,
      supportsStreaming: true,
      supportsVision: false,
    },
    contextWindow: 8192,
    defaultResponseMode: "descriptive",
    isActive: true,
  },
  {
    id: "openai/gpt-oss-20b",
    label: "GPT-OSS 20B",
    provider: "groq",
    description: "Fast open model on Groq, with web search",
    family: "GPT-OSS",
    tags: ["fast", "tools", "search"],
    capabilities: {
      supportsTools: true,
      supportsImages: false,
      supportsReasoning: false,
      supportsStreaming: true,
      supportsVision: false,
    },
    contextWindow: 8192,
    defaultResponseMode: "concise",
    isActive: true,
  },
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B",
    provider: "groq",
    description: "Balanced reasoning and drafting",
    family: "Llama 3.3",
    tags: ["balanced", "tools"],
    capabilities: {
      supportsTools: true,
      supportsImages: false,
      supportsReasoning: false,
      supportsStreaming: true,
      supportsVision: false,
    },
    contextWindow: 128000,
    defaultResponseMode: "descriptive",
    isActive: true,
  },
];

export const MODEL_LABELS = Object.fromEntries(
  MODEL_REGISTRY.map((model) => [model.id, model.label]),
) as Record<string, string>;

export function getModel(modelId: string): ModelMetadata | undefined {
  return MODEL_REGISTRY.find((m) => m.id === modelId);
}

export function getActiveModels(): ModelMetadata[] {
  return MODEL_REGISTRY.filter((m) => m.isActive);
}

export const DEFAULT_USER_MODEL = MODEL_REGISTRY[0].id;
export const DEFAULT_GUEST_MODEL = "ministral-8b-2512";

export const GUEST_ALLOWED_MODELS = [
  DEFAULT_GUEST_MODEL,
  "github:openai/gpt-4o-mini",
  "github:meta/Llama-4-Scout-17B-16E-Instruct",
];

export function getDefaultModel(isGuest: boolean): string {
  return isGuest ? DEFAULT_GUEST_MODEL : DEFAULT_USER_MODEL;
}
