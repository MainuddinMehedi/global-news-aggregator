import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTopicOwner } from "@/lib/auth/requireTopicOwner";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ownership = await requireTopicOwner(id);
    if (!ownership.ok) return ownership.response;

    const topic = await prisma.lockedTopic.findUnique({
      where: { id },
      select: { lastScannedAt: true, matchCount: true },
    });

    if (!topic) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(topic);
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
