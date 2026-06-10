import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; findingId: string }> },
) {
  try {
    const { id, findingId } = await params;

    // 1. Delete the specific finding from the database
    await prisma.topicFinding.delete({
      where: {
        id: findingId,
        topicId: id, // Scoped by topicId for extra safety
      },
    });

    // 2. Decrement topic matchCount safely (preventing negative values)
    const topic = await prisma.lockedTopic.findUnique({
      where: { id },
      select: { matchCount: true },
    });

    if (topic) {
      const newCount = Math.max(0, topic.matchCount - 1);
      await prisma.lockedTopic.update({
        where: { id },
        data: { matchCount: newCount },
      });
    }

    // 3. Revalidate cache tags for real-time UI updates
    revalidateTag(`locked-topic-${id}`, "max");
    revalidateTag(`topic-findings-${id}`, "max");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete Finding Error:", error);
    return NextResponse.json(
      { error: "Failed to delete finding" },
      { status: 500 },
    );
  }
}
