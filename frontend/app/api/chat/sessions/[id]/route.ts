import { NextResponse } from "next/server";
import type { UIMessage } from "ai";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { normalizeContextForDb } from "@/lib/chat/contexts";
import type { ContextItem } from "@/types/chat";

function toUiMessage(message: {
  id: string;
  role: string;
  parts: unknown;
  metadata: unknown;
}): UIMessage {
  return {
    id: message.id,
    role:
      message.role === "user" ||
      message.role === "assistant" ||
      message.role === "system"
        ? message.role
        : "assistant",
    parts: Array.isArray(message.parts)
      ? (message.parts as UIMessage["parts"])
      : [],
    metadata: message.metadata ?? undefined,
  };
}

function hasStoredMessageContent(message: { role: string; text: string }) {
  return message.role !== "assistant" || message.text.trim().length > 0;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await prisma.chatSession.findFirst({
      where: { id, isArchived: false },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        contexts: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const authSession = await auth();
    if (session.userId !== null && session.userId !== authSession?.user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        model: session.model,
        responseMode: session.responseMode,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        messages: session.messages
          .filter(hasStoredMessageContent)
          .map(toUiMessage),
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
      },
    });
  } catch (error) {
    console.error("Failed to load chat session:", error);
    return NextResponse.json(
      { error: "Failed to load chat session" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updateData: {
      title?: string;
      model?: string;
      responseMode?: string;
      isArchived?: boolean;
    } = {};

    if (typeof body.title === "string") updateData.title = body.title;
    if (typeof body.model === "string") updateData.model = body.model;
    if (typeof body.responseMode === "string") {
      updateData.responseMode = body.responseMode;
    }
    if (typeof body.isArchived === "boolean") {
      updateData.isArchived = body.isArchived;
    }

    let session = await prisma.chatSession.findUnique({ where: { id } });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const authSession = await auth();
    if (session.userId !== null && session.userId !== authSession?.user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (Object.keys(updateData).length > 0) {
      session = await prisma.chatSession.update({
        where: { id },
        data: updateData,
      });
    }

    if (Array.isArray(body.contexts)) {
      await prisma.$transaction([
        prisma.chatContext.deleteMany({
          where: { sessionId: id },
        }),
        ...(body.contexts.length > 0
          ? [
              prisma.chatContext.createMany({
                data: (body.contexts as ContextItem[]).map((context) => ({
                  sessionId: id,
                  ...normalizeContextForDb(context),
                })),
              }),
            ]
          : []),
      ]);

      // Bump updatedAt to move the session to the top of the history list
      if (Object.keys(updateData).length === 0) {
        session = await prisma.chatSession.update({
          where: { id },
          data: { updatedAt: new Date() },
        });
      }
    }

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        model: session.model,
        responseMode: session.responseMode,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to update chat session:", error);
    return NextResponse.json(
      { error: "Failed to update chat session" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await prisma.chatSession.findUnique({ where: { id } });
    
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const authSession = await auth();
    if (session.userId !== null && session.userId !== authSession?.user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.chatSession.update({
      where: { id },
      data: { isArchived: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to archive chat session:", error);
    return NextResponse.json(
      { error: "Failed to archive chat session" },
      { status: 500 },
    );
  }
}
