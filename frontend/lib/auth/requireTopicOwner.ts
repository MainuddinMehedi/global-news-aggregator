import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

type OwnershipResult =
  | { ok: true; userId: string; topicId: string }
  | { ok: false; response: NextResponse };

export async function requireTopicOwner(topicId: string): Promise<OwnershipResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const topic = await prisma.lockedTopic.findUnique({
    where: { id: topicId },
    select: { userId: true },
  });

  // Return 404 for both "not found" and "wrong owner" — prevents ID enumeration attacks
  if (!topic || topic.userId !== session.user.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  return { ok: true, userId: session.user.id, topicId };
}
