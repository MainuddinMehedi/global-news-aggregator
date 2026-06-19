import { NextRequest, NextResponse } from "next/server";
import { startBoss } from "@/lib/boss";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const boss = await startBoss();

    console.log(`[Scan Route] Queueing scan for topic ${id}...`);

    // Enqueue the job. We don't await completion.
    const jobId = await boss.send("scan-queue", { topicId: id });

    return NextResponse.json({ id, status: "queued", jobId });
  } catch (error) {
    console.error("Scan failed:", error);
    // TODO(notification): User - Manual scan returns 0 + source errors → response includes `warnings` array to be shown in UI
    return NextResponse.json(
      { error: "Failed to queue scan" },
      { status: 500 },
    );
  }
}
