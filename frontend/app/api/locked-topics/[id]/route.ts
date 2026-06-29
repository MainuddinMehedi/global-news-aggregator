import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { requireTopicOwner } from "@/lib/auth/requireTopicOwner";

// This route is for the full CRUD operation on locked-topics.

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
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Update lastViewedAt
    await prisma.lockedTopic.update({
      where: { id },
      data: { lastViewedAt: new Date() },
    });

    revalidateTag(`locked-topics-${ownership.userId}`, "max");
    revalidateTag(`locked-topic-${id}`, "max");

    return NextResponse.json(topic);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch topic" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ownership = await requireTopicOwner(id);
    if (!ownership.ok) return ownership.response;
    
    const body = await req.json();

    // If archiving and saving a final summary, delete all findings to save space
    if (body.isActive === false && body.aiQuerySummary) {
      await prisma.topicFinding.deleteMany({
        where: { topicId: id },
      });
    }

    const { suggestedSources, ...updateData } = body;

    const updated = await prisma.lockedTopic.update({
      where: { id },
      data: updateData,
    });

    revalidateTag(`locked-topics-${ownership.userId}`, "max");
    revalidateTag(`locked-topic-${id}`, "max");

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update topic" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ownership = await requireTopicOwner(id);
    if (!ownership.ok) return ownership.response;

    await prisma.lockedTopic.delete({
      where: { id },
    });

    revalidateTag(`locked-topics-${ownership.userId}`, "max");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete topic" },
      { status: 500 },
    );
  }
}
