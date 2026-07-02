export function buildProviderOptions({
  adaptiveThinking,
  effectiveModel,
  modelProvider,
  responseMode,
}: {
  adaptiveThinking: boolean;
  effectiveModel: string;
  modelProvider: string;
  responseMode: "concise" | "descriptive";
}) {
  return {
    ...(adaptiveThinking && effectiveModel.startsWith("openai/gpt-oss")
      ? {
          openai: {
            reasoningEffort: responseMode === "concise" ? "low" : "medium",
          },
        }
      : {}),
    ...(adaptiveThinking && modelProvider === "google"
      ? {
          google: {
            thinking: {
              type: "enabled",
              budgetTokens: responseMode === "concise" ? 2000 : 4000,
            },
          },
        }
      : {}),
    ...(modelProvider === "groq"
      ? { openai: { parallelToolCalls: false } }
      : {}),
  };
}
