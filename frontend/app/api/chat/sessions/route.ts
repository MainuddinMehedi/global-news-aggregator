import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  DEFAULT_USER_MODEL,
  DEFAULT_GUEST_MODEL,
  GUEST_ALLOWED_MODELS,
} from "@/lib/ai/modelRegistry";
import {
  listUserChatSessions,
  createChatSession,
  saveChatContexts,
} from "@/lib/chat/db";
import type { ContextItem } from "@/types/chat";

export async function GET() {
  try {
    const authSession = await auth();

    if (!authSession?.user?.id) {
      return NextResponse.json({ sessions: [] });
    }

    const sessions = await listUserChatSessions(authSession.user.id);

    return NextResponse.json({
      sessions: sessions.map((session) => ({
        id: session.id,
        title: session.title,
        model: session.model,
        responseMode: session.responseMode,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        messageCount: session._count.messages,
        contexts: session.contexts.map((context) => ({
          id: context.sourceId ?? context.id,
          dbId: context.id,
          type: context.sourceType,
          sourceType: context.sourceType,
          sourceId: context.sourceId,
          title: context.title,
          url: context.url ?? undefined,
          snapshot: context.snapshot,
        })),
      })),
    });
  } catch (error) {
    console.error("Failed to list chat sessions:", error);
    return NextResponse.json(
      { error: "Failed to list chat sessions" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const authSession = await auth();
    const isGuest = !authSession?.user?.id;
    const userId = authSession?.user?.id || null;

    const {
      title = "New Chat",
      model,
      responseMode = "concise",
      contexts = [],
    } = await req.json();

    let effectiveModel = model || DEFAULT_USER_MODEL;
    if (isGuest && !GUEST_ALLOWED_MODELS.includes(effectiveModel)) {
      effectiveModel = DEFAULT_GUEST_MODEL;
    }

    const session = await createChatSession({
      title,
      model: effectiveModel,
      responseMode,
      userId,
    });

    if (Array.isArray(contexts) && contexts.length > 0) {
      await saveChatContexts(session.id, contexts as ContextItem[]);
    }

    return NextResponse.json(
      {
        session: {
          id: session.id,
          title: session.title,
          model: session.model,
          responseMode: session.responseMode,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
          messageCount: 0,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create chat session:", error);
    return NextResponse.json(
      { error: "Failed to create chat session" },
      { status: 500 },
    );
  }
}
