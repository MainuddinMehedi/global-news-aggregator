import { upsertChatMessage } from "@/lib/chat/db";

export async function checkAndHandleGuestLimits({
  isGuest,
  messages,
  activeSessionId,
}: {
  isGuest: boolean;
  messages: Array<{ role: string }>;
  activeSessionId?: string;
}): Promise<Response | null> {
  if (!isGuest) return null;

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  if (userMessageCount <= 10) return null;

  const encoder = new TextEncoder();
  const limitMessage =
    "You've reached the 10-message limit for guest sessions. We rely on limited free-tier AI APIs to keep this platform accessible, and capping unauthenticated chats helps us manage API quotas and prevent database bloat. Please sign in to continue this conversation and help us prevent abuse.";

  if (activeSessionId) {
    const responseId = `msg-${Date.now().toString(36)}`;

    await upsertChatMessage({
      id: responseId,
      sessionId: activeSessionId,
      role: "assistant",
      text: limitMessage,
      parts: [{ type: "text", text: limitMessage }],
    });
  }

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`0:${JSON.stringify(limitMessage)}\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "X-Vercel-AI-Data-Stream": "v1",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
