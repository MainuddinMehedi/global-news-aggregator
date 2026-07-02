export function normalizeError(err: unknown): string {
  if (typeof err === "string") {
    return err;
  }

  let errorMessage = "Failed to get response. Please try again.";

  if (err && typeof err === "object") {
    const errObj = err as Record<string, unknown>;

    if (typeof errObj.message === "string") {
      try {
        const parsed = JSON.parse(errObj.message);

        if (parsed && typeof parsed === "object" && "message" in parsed) {
          errorMessage = String((parsed as Record<string, unknown>).message);
        } else {
          errorMessage = errObj.message;
        }
      } catch {
        errorMessage = errObj.message;
      }
    } else if (typeof errObj.error === "string") {
      errorMessage = errObj.error;
    }

    if (
      errObj.type === "invalid_request_error" ||
      errObj.code === "request_too_large"
    ) {
      if (
        errorMessage.includes("Request Entity Too Large") ||
        errorMessage.includes("request_too_large")
      ) {
        return "Request too large: The conversation context has grown too big. Try asking a shorter question or starting a new conversation.";
      }
      return `Request error: ${errorMessage}`;
    }
  }

  // Safety net — internal/Prisma errors that leaked past the server
  if (
    errorMessage.includes("Invalid prisma.") ||
    errorMessage.startsWith("\nInvalid prisma.") ||
    errorMessage.includes("Something went wrong saving")
  ) {
    return "Something went wrong saving the conversation. Your message was still sent.";
  }

  return errorMessage;
}

export function formatStreamError(error: unknown) {
  const err =
    error && typeof error === "object"
      ? (error as Record<string, unknown>)
      : {};
  const message = typeof err.message === "string" ? err.message : "";
  const code = typeof err.code === "string" ? err.code : "";
  const statusCode =
    typeof err.statusCode === "number" ? err.statusCode : undefined;

  const constructorName =
    typeof err.constructor === "function" ? err.constructor.name : "";

  // Groq specific debugging for tool_use_failed
  if (code === "tool_use_failed" || message.includes("failed_generation")) {
    const failedGeneration =
      err.failed_generation ||
      (err.responseBody as { error?: { failed_generation?: string } })?.error
        ?.failed_generation;

    if (failedGeneration) {
      console.error("GROQ FAILED GENERATION:", failedGeneration);
    } else {
      console.error(
        "GROQ TOOL ERROR OBJECT:",
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      );
    }
  }

  // ── Known user-facing errors ──

  if (
    statusCode === 413 ||
    code === "request_too_large" ||
    message.includes("Request Entity Too Large")
  ) {
    return "This conversation is too large for this model\u2019s context window. Switch to a model with a larger context (like Llama 4 Scout or Maverick with 1M\u201310M tokens) or start a new conversation.";
  }

  if (message.includes("tool calling is not supported")) {
    return "This model uses built-in tools and doesn\u2019t support external tool definitions. Switch to a different model.";
  }

  if (code === "rate_limit_exceeded" || message.includes("tokens per minute")) {
    return "Rate limit reached for this model. Try switching to a different model or wait a moment before sending another message.";
  }

  // ── Prisma errors (never show DB internals) ──
  if (
    constructorName.startsWith("Prisma") ||
    constructorName.startsWith("PrismaClient")
  ) {
    return "Something went wrong saving the conversation. Your message was still sent.";
  }

  // ── API errors with a statusCode ──
  if (statusCode) {
    const responseBody = err.responseBody;
    if (typeof responseBody === "string") {
      try {
        const parsed = JSON.parse(responseBody);
        const apiMsg = parsed?.error?.message || parsed?.error;
        if (apiMsg && typeof apiMsg === "string") return apiMsg;
      } catch {
        // ignore parse errors, fall through to raw message
      }
    }
    return message || "The API returned an error. Please try again.";
  }

  // ── Internal/SDK errors (no statusCode) ──
  return "Something went wrong. Please try again.";
}
