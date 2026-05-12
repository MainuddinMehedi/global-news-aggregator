import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Spawn the background worker (processTopics.js) detached from this request
    const workerPath = path.join(
      process.cwd(),
      "..",
      "ingestion-service",
      "processTopics.js",
    );

    console.log(`[Scan Route] Spawning background worker for topic ${id}...`);
    console.log(`[Scan Route] Worker Path: ${workerPath}`);

    const child = spawn("node", [workerPath, `--topic-id=${id}`], {
      detached: true,
      stdio: "ignore",
    });

    // Unref allows the parent (Next.js server) to exit independently of the child
    child.unref();

    return NextResponse.json({ id, status: "initiated" });
  } catch (error) {
    console.error("Scan trigger failed:", error);
    return NextResponse.json(
      { error: "Failed to trigger scan" },
      { status: 500 },
    );
  }
}
