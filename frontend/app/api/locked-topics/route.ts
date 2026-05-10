import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      displayName,
      userContext,
      aiRefinedQuery,
      aiQuerySummary,
      sources,
      notifyEnabled,
    } = body;

    const topic = await prisma.lockedTopic.create({
      data: {
        displayName,
        userContext,
        aiRefinedQuery,
        aiQuerySummary,
        sources: sources || [],
        notifyEnabled: notifyEnabled ?? false,
        notifyMode: "DIGEST",
        notifyChannels: { discord: false, telegram: false },
        isActive: true,
      },
    });

    revalidateTag("locked-topics", "max");

    return NextResponse.json(topic);
  } catch (error) {
    console.error("Create Topic Error:", error);
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 },
    );
  }
}
