"use server";

import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { verifyAdmin } from "./varifyAdmin";

export async function forceRecategorizeArticle(
  processedArticleId: string,
  targetCategory: string,
) {
  await verifyAdmin();

  try {
    const category = await prisma.category.upsert({
      where: { name: targetCategory },
      update: {},
      create: { name: targetCategory },
    });

    await prisma.processedArticle.update({
      where: { id: processedArticleId },
      data: {
        clusterStatus: "FAILED_ENRICHMENT",
        categories: {
          set: [{ id: category.id }],
        },
      },
    });

    revalidateTag("articles", "max");
    return { success: true };
  } catch (error: any) {
    console.error("forceRecategorizeArticle error:", error);
    return { success: false, error: error.message };
  }
}

export async function retryFailedEnrichments(articleIds: string[]) {
  await verifyAdmin();

  try {
    if (!articleIds || articleIds.length === 0) {
      throw new Error("No article IDs provided.");
    }

    await prisma.processedArticle.updateMany({
      where: { id: { in: articleIds } },
      data: { clusterStatus: "FAILED_ENRICHMENT" },
    });

    revalidateTag("articles", "max");
    return { success: true };
  } catch (error: any) {
    console.error("retryFailedEnrichments error:", error);
    return { success: false, error: error.message };
  }
}

export async function discardFailedEnrichments(articleIds: string[]) {
  await verifyAdmin();

  try {
    if (!articleIds || articleIds.length === 0) {
      throw new Error("No article IDs provided.");
    }

    const otherCategory = await prisma.category.upsert({
      where: { name: "other" },
      update: {},
      create: { name: "other" },
    });

    await prisma.$transaction(
      articleIds.map((id) =>
        prisma.processedArticle.update({
          where: { id },
          data: {
            clusterStatus: "SKIPPED",
            categories: {
              set: [{ id: otherCategory.id }],
            },
          },
        }),
      ),
    );

    revalidateTag("articles", "max");
    return { success: true };
  } catch (error: any) {
    console.error("discardFailedEnrichments error:", error);
    return { success: false, error: error.message };
  }
}
