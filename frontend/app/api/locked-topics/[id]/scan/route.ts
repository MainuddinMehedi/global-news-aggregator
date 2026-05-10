import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateTag } from "next/cache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Simulate scanning delay in background
    // In production, this would trigger a GitHub Action
    (async () => {
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      try {
        await prisma.lockedTopic.update({
          where: { id },
          data: { lastScannedAt: new Date() },
        });
        updateTag(`locked-topic-${id}`);
        updateTag("locked-topics");
      } catch (err) {
        console.error("Delayed scan update failed:", err);
      }
    })();

    return NextResponse.json({ id, status: "initiated" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to initiate scan" }, { status: 500 });
  }
}
