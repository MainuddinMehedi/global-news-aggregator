import { NextRequest, NextResponse } from "next/server";
import { getFindings } from "@/queries/topicFindings";
import { FindingSource } from "@/types/lockedTopic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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
