import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Mark all findings for this topic as read
    await prisma.topicFinding.updateMany({
      where: {
        topicId: id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Also update lastViewedAt on the topic
    await prisma.lockedTopic.update({
      where: { id },
      data: { lastViewedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark as read failed:", error);
    return NextResponse.json(
      { error: "Failed to mark findings as read" },
      { status: 500 },
    );
  }
}
