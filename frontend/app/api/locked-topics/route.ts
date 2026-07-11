import { auth } from "@/auth";
import { generateQueryEmbedding } from "@/lib/ai/embeddings";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      displayName,
      userContext,
      aiRefinedQuery,
      aiQuerySummary,
      conceptualKeywords,
      sources,
      notifyEnabled,
      notifyMode,
      notifyChannels,
    } = body;

    const topic = await prisma.lockedTopic.create({
      data: {
        displayName,
        userContext,
        aiRefinedQuery,
        aiQuerySummary,
        userId: session.user.id,
        conceptualKeywords: conceptualKeywords || [],
        sources: sources || [],
        notifyEnabled: notifyEnabled ?? false,
        notifyMode: notifyMode || "DIGEST",
        notifyChannels: notifyChannels || { discord: false, telegram: false },
        isActive: true,
      },
    });

    revalidateTag(`locked-topics-${session.user.id}`, "max");

    // Generate and save embedding before returning
    try {
      const intentString = `${displayName}\n\n${aiQuerySummary}\n\n${aiRefinedQuery}`;
      const embeddingVector = await generateQueryEmbedding(intentString);
      const vectorStr = `[${embeddingVector.join(",")}]`;

      // Update the newly created topic with the embedding vector
      await prisma.$executeRaw`
        UPDATE "LockedTopic" 
        SET "queryEmbedding" = ${vectorStr}::vector 
        WHERE id = ${topic.id}
      `;
    } catch (embErr) {
      console.error("Failed to generate/save embedding for topic:", embErr);
      // We don't fail the request if the embedding fails, backfill can catch it
    }

    return NextResponse.json(topic);
  } catch (error) {
    console.error("Create Topic Error:", error);
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 },
    );
  }
}
