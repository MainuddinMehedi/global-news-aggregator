export type ChatModelOption = {
  id: string;
  label: string;
  description: string;
  provider: "groq" | "google" | "github";
};

export const CHAT_MODELS: ChatModelOption[] = [
  {
    id: "groq/compound-mini",
    label: "Compound Mini",
    provider: "groq",
    description: "Fast everyday work with search-capable Groq routing",
  },
  {
    id: "groq/compound",
    label: "Compound Search",
    provider: "groq",
    description: "Web search for current analysis",
  },
  {
    id: "gemma-4-31b",
    label: "Gemma 4 31B",
    provider: "google",
    description: "Large-context article analysis",
  },
  {
    id: "gemma-4-26b",
    label: "Gemma 4 26B",
    provider: "google",
    description: "Efficient large-context analysis",
  },
  {
    id: "gemini-3.1-flash-lite",
    label: "Gemini 3.1 Flash Lite",
    provider: "google",
    description: "Long context, lightweight",
  },
  {
    id: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash Lite",
    provider: "google",
    description: "Fast lightweight Google model",
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "google",
    description: "Multimodal and fast",
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    provider: "groq",
    description: "More capable open model on Groq",
  },
  {
    id: "openai/gpt-oss-20b",
    label: "GPT-OSS 20B",
    provider: "groq",
    description: "Fast open model on Groq",
  },
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B",
    provider: "groq",
    description: "Balanced reasoning and drafting",
  },
  {
    id: "github:openai/gpt-4.1",
    label: "GPT-4.1",
    provider: "github",
    description: "GitHub Models, strong general reasoning",
  },
  {
    id: "github:openai/gpt-4o",
    label: "GPT-4o",
    provider: "github",
    description: "GitHub Models, balanced multimodal model",
  },
  {
    id: "github:deepseek/DeepSeek-R1",
    label: "DeepSeek R1",
    provider: "github",
    description: "GitHub Models, deep reasoning",
  },
  {
    id: "github:xai/grok-3-mini",
    label: "Grok 3 Mini",
    provider: "github",
    description: "GitHub Models, fast reasoning",
  },
];

export const MODEL_LABELS = Object.fromEntries(
  CHAT_MODELS.map((model) => [model.id, model.label]),
) as Record<string, string>;
