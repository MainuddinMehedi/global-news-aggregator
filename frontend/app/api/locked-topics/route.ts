import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { generateQueryEmbedding } from "@/lib/ai/embeddings";

export async function POST(req: NextRequest) {
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
        conceptualKeywords: conceptualKeywords || [],
        sources: sources || [],
        notifyEnabled: notifyEnabled ?? false,
        notifyMode: notifyMode || "DIGEST",
        notifyChannels: notifyChannels || { discord: false, telegram: false },
        isActive: true,
      },
    });

    revalidateTag("locked-topics", "max");

    // Generate and save embedding before returning
    try {
      const intentString = `${displayName}\n\n${aiQuerySummary}\n\n${aiRefinedQuery}`;
      const embeddingVector = await generateQueryEmbedding(intentString);
      
      // Update the newly created topic with the embedding vector
      await prisma.$executeRaw`
        UPDATE "LockedTopic" 
        SET "queryEmbedding" = ${embeddingVector}::vector 
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
