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
