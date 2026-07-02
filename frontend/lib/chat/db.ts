import prisma from "@/lib/prisma";
import { Prisma } from "@news/db";
import { normalizeContextForDb } from "@/lib/chat/contexts";
import type { ContextItem } from "@/types/chat";

export async function createChatSession({
  title,
  model,
  responseMode,
  userId,
}: {
  title: string;
  model: string;
  responseMode: string;
  userId?: string | null;
}) {
  return await prisma.chatSession.create({
    data: { title, model, responseMode, userId },
  });
}

export async function updateChatSession(
  id: string,
  data: {
    title?: string;
    model?: string;
    responseMode?: string;
    isArchived?: boolean;
    updatedAt?: Date;
  },
) {
  return await prisma.chatSession.update({
    where: { id },
    data,
  });
}

export async function getChatSessionById(id: string) {
  return await prisma.chatSession.findFirst({
    where: { id, isArchived: false },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      contexts: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function listUserChatSessions(userId: string, take: number = 50) {
  return await prisma.chatSession.findMany({
    where: { isArchived: false, userId },
    orderBy: { updatedAt: "desc" },
    take,
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
}

export async function archiveChatSession(id: string) {
  return await prisma.chatSession.update({
    where: { id },
    data: { isArchived: true },
  });
}

export async function upsertChatMessage({
  id,
  sessionId,
  role,
  text,
  parts,
  metadata,
}: {
  id: string;
  sessionId: string;
  role: string;
  text: string;
  parts: unknown;
  metadata?: unknown;
}) {
  const partsJson = (
    parts === undefined || parts === null ? undefined : parts
  ) as Prisma.InputJsonValue;
  const metadataJson = (
    metadata === undefined || metadata === null ? undefined : metadata
  ) as Prisma.InputJsonValue;

  return await prisma.chatMessage.upsert({
    where: { id },
    update: {
      text,
      parts: partsJson,
      metadata: metadataJson,
    },
    create: {
      id,
      sessionId,
      role,
      text,
      parts: partsJson,
      metadata: metadataJson,
    },
  });
}

export async function createChatMessage({
  id,
  sessionId,
  role,
  text,
  parts,
}: {
  id: string;
  sessionId: string;
  role: string;
  text: string;
  parts: unknown;
}) {
  const partsJson = (
    parts === undefined || parts === null ? undefined : parts
  ) as Prisma.InputJsonValue;

  return await prisma.chatMessage.create({
    data: {
      id,
      sessionId,
      role,
      text,
      parts: partsJson,
    },
  });
}

export async function saveChatContexts(
  sessionId: string,
  contexts: ContextItem[],
) {
  return await prisma.chatContext.createMany({
    data: contexts.map((context) => ({
      sessionId,
      ...normalizeContextForDb(context),
    })),
    skipDuplicates: true,
  });
}

export async function overwriteChatContexts(
  sessionId: string,
  contexts: ContextItem[],
) {
  return await prisma.$transaction([
    prisma.chatContext.deleteMany({
      where: { sessionId },
    }),
    ...(contexts.length > 0
      ? [
          prisma.chatContext.createMany({
            data: contexts.map((context) => ({
              sessionId,
              ...normalizeContextForDb(context),
            })),
          }),
        ]
      : []),
  ]);
}
