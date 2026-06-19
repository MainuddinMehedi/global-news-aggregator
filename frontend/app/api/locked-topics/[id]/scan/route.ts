import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const workerPath = path.join(
      process.cwd(),
      "..",
      "ingestion-service",
      "processTopics.js",
    );

    console.log(`[Scan Route] Starting scan for topic ${id}...`);

    const repoRoot = path.join(process.cwd(), "..");

    // For manual "Scan Now", we wait for the process to finish to return the count
    const child = spawn(process.execPath, [workerPath, `--topic-id=${id}`], {
      cwd: repoRoot,
    });

    let output = "";
    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    child.stderr.on("data", (data) => {
      console.error(`[Scan Worker Error] ${data}`);
    });

    const exitCode = await new Promise((resolve) => {
      child.on("close", resolve);
    });

    if (exitCode !== 0) {
      throw new Error(`Scan worker exited with code ${exitCode}`);
    }

    // Parse output for "Found X new findings total"
    const match = output.match(/Found (\d+) new findings total/);
    const count = match ? parseInt(match[1]) : 0;

    console.log(`[Scan Route] Scan finished. Found ${count} new findings.`);

    return NextResponse.json({ id, status: "completed", count });
  } catch (error) {
    console.error("Scan failed:", error);
    // TODO(notification): User - Manual scan returns 0 + source errors → response includes `warnings` array to be shown in UI
    return NextResponse.json(
      { error: "Failed to perform scan" },
      { status: 500 },
    );
  }
}
