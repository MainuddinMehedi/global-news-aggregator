import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";

// This route is for the full CRUD operation on locked-topics.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    revalidateTag("locked-topics", "max");
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
    const body = await req.json();

    const updated = await prisma.lockedTopic.update({
      where: { id },
      data: body,
    });

    revalidateTag("locked-topics", "max");
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

    // Check if we should generate a summary first
    const { searchParams } = new URL(req.url);
    const generateSummary = searchParams.get("generateSummary") === "true";

    if (generateSummary) {
      // TODO: Implement the summary generation logic at deletion.
      // Summary generation logic would go here, for now just delete
    }

    await prisma.lockedTopic.delete({
      where: { id },
    });

    revalidateTag("locked-topics", "max");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete topic" },
      { status: 500 },
    );
  }
}
