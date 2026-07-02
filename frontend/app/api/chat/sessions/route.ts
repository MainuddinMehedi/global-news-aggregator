import { auth } from "@/auth";
import { normalizeContextForDb } from "@/lib/chat/contexts";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authSession = await auth();

    if (!authSession?.user?.id) {
      return NextResponse.json({ sessions: [] });
    }

    const sessions = await prisma.chatSession.findMany({
      where: { isArchived: false, userId: authSession.user.id },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        model: true,
        responseMode: true,
        createdAt: true,
        updatedAt: true,
        contexts: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            sourceType: true,
            sourceId: true,
            title: true,
            url: true,
            snapshot: true,
          },
        },
        _count: { select: { messages: true } },
      },
    });

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
    const userId = authSession?.user?.id || null;

    const {
      title = "New Chat",
      model = "gemini-3.1-flash-lite",
      responseMode = "concise",
      contexts = [],
    } = await req.json();

    const session = await prisma.chatSession.create({
      data: { title, model, responseMode, userId },
    });

    if (Array.isArray(contexts) && contexts.length > 0) {
      await prisma.chatContext.createMany({
        data: contexts.map((context) => ({
          sessionId: session.id,
          ...normalizeContextForDb(context),
        })),
        skipDuplicates: true,
      });
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
