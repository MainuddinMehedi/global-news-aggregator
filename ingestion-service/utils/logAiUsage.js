import { prisma } from "../db/prisma.js";

export async function logAiUsage(provider, model, tokensUsed, costPer1k) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const estimatedCost = (tokensUsed / 1000) * costPer1k;

    await prisma.aiUsage.create({
      data: {
        date: today,
        provider,
        model,
        tokensUsed,
        estimatedCost,
        success: true,
      },
    });
  } catch (err) {
    console.error(`⚠️ Failed to log AI usage:`, err.message);
  }
}
