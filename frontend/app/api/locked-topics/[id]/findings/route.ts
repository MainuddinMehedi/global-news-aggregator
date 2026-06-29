import { NextRequest, NextResponse } from "next/server";
import { getFindings } from "@/queries/topicFindings";
import { FindingSource } from "@/types/lockedTopic";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { requireTopicOwner } from "@/lib/auth/requireTopicOwner";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ownership = await requireTopicOwner(id);
    if (!ownership.ok) return ownership.response;

    const { searchParams } = new URL(req.url);

    const source = searchParams.get("source") || "ALL";
    const sort = searchParams.get("sort") || "newest";
    const cursor = searchParams.get("cursor") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const result = await getFindings({
      topicId: id,
      sourceType: source as FindingSource | "ALL",
      sort: sort as "newest" | "oldest" | "relevance",
      cursor,
      limit,
      unreadOnly,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Fetch Findings Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch findings" },
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

    // 1. Delete all findings for this topic
    await prisma.topicFinding.deleteMany({
      where: { topicId: id },
    });

    // 2. Reset topic metadata (matchCount and lastScannedAt)
    await prisma.lockedTopic.update({
      where: { id },
      data: {
        matchCount: 0,
        lastMatchedAt: null,
        lastScannedAt: null,
      },
    });

    // 3. Revalidate cache
    revalidateTag(`locked-topics-${ownership.userId}`, "max");
    revalidateTag(`locked-topic-${id}`, "max");
    revalidateTag(`topic-findings-${id}`, "max");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Clear Findings Error:", error);
    return NextResponse.json(
      { error: "Failed to clear findings" },
      { status: 500 },
    );
  }
}
