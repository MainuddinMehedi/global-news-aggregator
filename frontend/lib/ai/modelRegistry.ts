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

  // ── GITHUB PROVIDER ──────────────────────────────────────────────────────
  {
    id: "github:openai/gpt-4.1",
    label: "GPT-4.1",
    provider: "github",
    description: "GitHub Models, strong general reasoning with 1M context",
    family: "GPT-4",
    tags: ["reasoning", "tools", "vision"],
    capabilities: {
      supportsTools: true,
      supportsImages: true,
      supportsReasoning: true,
      supportsStreaming: true,
      supportsVision: true,
    },
    contextWindow: 1000000,
    defaultResponseMode: "descriptive",
    isActive: true,
  },
  // {
  //   id: "github:deepseek/DeepSeek-V3-0324",
  //   label: "DeepSeek V3 (0324)",
  //   provider: "github",
  //   description: "SOTA 671B MoE model, optimized for writing and search",
  //   family: "DeepSeek V3",
  //   tags: ["fast", "writing", "tools"],
  //   capabilities: {
  //     supportsTools: true,
  //     supportsImages: false,
  //     supportsReasoning: false,
  //     supportsStreaming: true,
  //     supportsVision: false,
  //   },
  //   contextWindow: 128000,
  //   defaultResponseMode: "descriptive",
  //   isActive: true,
  // },
  {
    id: "github:deepseek/DeepSeek-R1-0528",
    label: "DeepSeek R1 (0528)",
    provider: "github",
    description: "Upgraded reasoning model with 87.5% AIME accuracy",
    family: "DeepSeek R1",
    tags: ["reasoning", "deep-thinking", "tools"],
    capabilities: {
      supportsTools: true,
      supportsImages: false,
      supportsReasoning: true,
      supportsStreaming: true,
      supportsVision: false,
    },
    contextWindow: 128000,
    defaultResponseMode: "descriptive",
    isActive: true,
  },
  // {
  //   id: "github:mistral-ai/mistral-medium-2505",
  //   label: "Mistral Medium 3",
  //   provider: "github",
  //   description: "SOTA versatile model for dialogue, reasoning, and vision",
  //   family: "Mistral",
  //   tags: ["reasoning", "multimodal", "vision"],
  //   capabilities: {
  //     supportsTools: true,
  //     supportsImages: true,
  //     supportsReasoning: true,
  //     supportsStreaming: true,
  //     supportsVision: true,
  //   },
  //   contextWindow: 128000,
  //   defaultResponseMode: "descriptive",
  //   isActive: true,
  // },
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
    id: "github:meta/Llama-4-Maverick-17B-128E-Instruct",
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
