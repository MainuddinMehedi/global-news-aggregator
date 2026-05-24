export type ProviderName = "groq" | "google" | "github";

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
  // ── GROQ PROVIDER ────────────────────────────────────────────────────────
  {
    id: "groq/compound-mini",
    label: "Compound Mini",
    provider: "groq",
    description: "Fast everyday work with search-capable Groq routing",
    family: "Groq Compound",
    tags: ["fast", "search"],
    capabilities: {
      supportsTools: false,
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
    id: "groq/compound",
    label: "Compound Search",
    provider: "groq",
    description: "Web search for current analysis",
    family: "Groq Compound",
    tags: ["search", "analysis"],
    capabilities: {
      supportsTools: false,
      supportsImages: false,
      supportsReasoning: false,
      supportsStreaming: true,
      supportsVision: false,
    },
    contextWindow: 8192,
    defaultResponseMode: "descriptive",
    isActive: true,
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    provider: "groq",
    description: "More capable open model on Groq",
    family: "GPT-OSS",
    tags: ["reasoning", "large"],
    capabilities: {
      supportsTools: false,
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
    description: "Fast open model on Groq",
    family: "GPT-OSS",
    tags: ["fast"],
    capabilities: {
      supportsTools: false,
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
    contextWindow: 32768,
    defaultResponseMode: "descriptive",
    isActive: true,
  },

  // ── GOOGLE PROVIDER ──────────────────────────────────────────────────────
  {
    id: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash Lite",
    provider: "google",
    description: "Fast lightweight Google model",
    family: "Gemini 2.5",
    tags: ["fast", "context", "vision"],
    capabilities: {
      supportsTools: true,
      supportsImages: true,
      supportsReasoning: false,
      supportsStreaming: true,
      supportsVision: true,
    },
    contextWindow: 1048576,
    defaultResponseMode: "concise",
    isActive: true,
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "google",
    description: "Multimodal and fast",
    family: "Gemini 2.5",
    tags: ["multimodal", "fast", "tools"],
    capabilities: {
      supportsTools: true,
      supportsImages: true,
      supportsReasoning: false,
      supportsStreaming: true,
      supportsVision: true,
    },
    contextWindow: 1048576,
    defaultResponseMode: "descriptive",
    isActive: true,
  },
  {
    id: "gemma-4-31b-it",
    label: "Gemma 4 31B",
    provider: "google",
    description: "Large-context article analysis",
    family: "Gemma 4",
    tags: ["context", "summarization"],
    capabilities: {
      supportsTools: false,
      supportsImages: false,
      supportsReasoning: false,
      supportsStreaming: true,
      supportsVision: false,
    },
    contextWindow: 8192,
    defaultResponseMode: "descriptive",
    isActive: true,
  },
  {
    id: "gemma-4-26b-a4b-it",
    label: "Gemma 4 26B",
    provider: "google",
    description: "Efficient large-context analysis",
    family: "Gemma 4",
    tags: ["fast", "context"],
    capabilities: {
      supportsTools: false,
      supportsImages: false,
      supportsReasoning: false,
      supportsStreaming: true,
      supportsVision: false,
    },
    contextWindow: 8192,
    defaultResponseMode: "concise",
    isActive: true,
  },

  // ── GITHUB PROVIDER ──────────────────────────────────────────────────────
  {
    id: "github:openai/gpt-4.1",
    label: "GPT-4.1",
    provider: "github",
    description: "GitHub Models, strong general reasoning",
    family: "GPT-4",
    tags: ["reasoning", "tools", "vision"],
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
    id: "github:openai/gpt-4o",
    label: "GPT-4o",
    provider: "github",
    description: "GitHub Models, balanced multimodal model",
    family: "GPT-4",
    tags: ["balanced", "multimodal", "tools"],
    capabilities: {
      supportsTools: true,
      supportsImages: true,
      supportsReasoning: false,
      supportsStreaming: true,
      supportsVision: true,
    },
    contextWindow: 128000,
    defaultResponseMode: "descriptive",
    isActive: true,
  },
  {
    id: "github:deepseek/DeepSeek-R1",
    label: "DeepSeek R1",
    provider: "github",
    description: "GitHub Models, deep reasoning",
    family: "DeepSeek R1",
    tags: ["reasoning", "deep-thinking"],
    capabilities: {
      supportsTools: false,
      supportsImages: false,
      supportsReasoning: true,
      supportsStreaming: true,
      supportsVision: false,
    },
    contextWindow: 128000,
    defaultResponseMode: "descriptive",
    isActive: true,
  },
  {
    id: "github:xai/grok-3-mini",
    label: "Grok 3 Mini",
    provider: "github",
    description: "GitHub Models, fast reasoning",
    family: "Grok 3",
    tags: ["fast", "reasoning", "tools"],
    capabilities: {
      supportsTools: true,
      supportsImages: false,
      supportsReasoning: false,
      supportsStreaming: true,
      supportsVision: false,
    },
    contextWindow: 32768,
    defaultResponseMode: "concise",
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
