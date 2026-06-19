import { NextRequest, NextResponse } from "next/server";
import { startBoss } from "@/lib/boss";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const jobId = url.searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Missing jobId parameter" },
        { status: 400 },
      );
    }

    const boss = await startBoss();
    const job = await boss.getJobById("scan-queue", jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      jobId: job.id,
      state: job.state,
      count: job.output || 0,
    });
  } catch (error) {
    console.error("Scan status fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch scan status" },
      { status: 500 },
    );
  }
}
