"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { startBoss } from "@/lib/boss";
import fs from "fs/promises";
import path from "path";

async function verifyAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Administrator privileges required.");
  }
}

export async function toggleFeedSource(id: string, enabled: boolean) {
  await verifyAdmin();
  try {
    const feed = await prisma.feedSource.update({
      where: { id },
      data: { enabled },
    });
    revalidateTag("articles", "max");
    return { success: true, feed };
  } catch (error: any) {
    console.error("toggleFeedSource error:", error);
    return { success: false, error: error.message };
  }
}

export async function resetFeedFailures(id: string) {
  await verifyAdmin();
  try {
    const feed = await prisma.feedSource.update({
      where: { id },
      data: { fetchFailures: 0 },
    });
    return { success: true, feed };
  } catch (error: any) {
    console.error("resetFeedFailures error:", error);
    return { success: false, error: error.message };
  }
}

export async function resetAllFeedFailures() {
  await verifyAdmin();
  try {
    await prisma.feedSource.updateMany({
      data: { fetchFailures: 0 },
    });
    return { success: true };
  } catch (error: any) {
    console.error("resetAllFeedFailures error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteFeedSource(id: string) {
  await verifyAdmin();
  try {
    await prisma.feedSource.delete({
      where: { id },
    });
    return { success: true };
  } catch (error: any) {
    console.error("deleteFeedSource error:", error);
    return { success: false, error: error.message };
  }
}

export async function saveFeedSource(data: {
  id?: string;
  name: string;
  url: string;
  sourceCountry: string;
  sourceType: string;
  biasGroup: string;
  coverageScope: string;
}) {
  await verifyAdmin();
  try {
    const { id, ...payload } = data;
    let feed;
    if (id) {
      feed = await prisma.feedSource.update({
        where: { id },
        data: payload,
      });
    } else {
      feed = await prisma.feedSource.create({
        data: {
          ...payload,
          enabled: true,
          fetchFailures: 0,
        },
      });
    }
    revalidateTag("articles", "max");
    return { success: true, feed };
  } catch (error: any) {
    console.error("saveFeedSource error:", error);
    return { success: false, error: error.message };
  }
}

export async function triggerManualIngestion() {
  await verifyAdmin();
  try {
    const b = await startBoss();
    await b.send("ingest-queue", {});
    return { success: true };
  } catch (error: any) {
    console.error("triggerManualIngestion error:", error);
    return { success: false, error: error.message };
  }
}

export async function saveAiConfig(data: {
  primary: {
    model: string;
    tpmLimit: number;
    rpmLimit: number;
    concurrencyLimit: number;
    batchSize: number;
  };
  fallback: {
    model: string;
    tpmLimit: number;
    rpmLimit: number;
    concurrencyLimit: number;
    batchSize: number;
  };
}) {
  await verifyAdmin();

  const validateModel = (cfg: typeof data.primary, name: string) => {
    if (
      !cfg.model ||
      typeof cfg.model !== "string" ||
      cfg.model.trim() === ""
    ) {
      throw new Error(`${name} model name is required.`);
    }
    if (cfg.batchSize < 1 || cfg.batchSize > 50) {
      throw new Error(`${name} batch size must be between 1 and 50.`);
    }
    if (cfg.concurrencyLimit < 1 || cfg.concurrencyLimit > 20) {
      throw new Error(`${name} concurrency limit must be between 1 and 20.`);
    }
    if (cfg.tpmLimit < 1) {
      throw new Error(`${name} TPM limit must be at least 1.`);
    }
    if (cfg.rpmLimit < 1) {
      throw new Error(`${name} RPM limit must be at least 1.`);
    }
  };

  try {
    validateModel(data.primary, "Primary");
    validateModel(data.fallback, "Fallback");

    const existing = await prisma.systemSetting.findUnique({
      where: { key: "ai_config" },
    });

    const existingValue = existing ? (existing.value as any) : {};
    const pauseAI =
      typeof existingValue.pauseAI === "boolean"
        ? existingValue.pauseAI
        : false;

    const newValue = {
      pauseAI,
      primary: {
        model: data.primary.model.trim(),
        tpmLimit: Math.floor(data.primary.tpmLimit),
        rpmLimit: Math.floor(data.primary.rpmLimit),
        concurrencyLimit: Math.floor(data.primary.concurrencyLimit),
        batchSize: Math.floor(data.primary.batchSize),
      },
      fallback: {
        model: data.fallback.model.trim(),
        tpmLimit: Math.floor(data.fallback.tpmLimit),
        rpmLimit: Math.floor(data.fallback.rpmLimit),
        concurrencyLimit: Math.floor(data.fallback.concurrencyLimit),
        batchSize: Math.floor(data.fallback.batchSize),
      },
    };

    await prisma.systemSetting.upsert({
      where: { key: "ai_config" },
      update: { value: newValue },
      create: {
        key: "ai_config",
        value: newValue,
        description: "AI Engine primary and fallback runtime configurations",
      },
    });

    revalidateTag("system-settings", "max");
    return { success: true };
  } catch (error: any) {
    console.error("saveAiConfig error:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleAiPause(paused: boolean) {
  await verifyAdmin();
  try {
    const existing = await prisma.systemSetting.findUnique({
      where: { key: "ai_config" },
    });

    let newValue: any;
    if (existing) {
      newValue = {
        ...(existing.value as any),
        pauseAI: paused,
      };
    } else {
      newValue = {
        pauseAI: paused,
        primary: {
          model: process.env.AI_PIPELINE_MODEL || "mistral-small-2506",
          tpmLimit: parseInt(process.env.AI_MISTRAL_TPM_LIMIT || "2250000", 10),
          rpmLimit: parseInt(process.env.AI_MISTRAL_RPM_LIMIT || "60", 10),
          concurrencyLimit: parseInt(
            process.env.AI_MISTRAL_CONCURRENCY || "5",
            10,
          ),
          batchSize: parseInt(process.env.AI_MISTRAL_BATCH_SIZE || "10", 10),
        },
        fallback: {
          model:
            process.env.AI_PIPELINE_FALLBACK_MODEL ||
            "meta-llama/llama-4-scout-17b-16e-instruct",
          tpmLimit: parseInt(process.env.AI_GROQ_TPM_LIMIT || "30000", 10),
          rpmLimit: parseInt(process.env.AI_GROQ_RPM_LIMIT || "28", 10),
          concurrencyLimit: parseInt(
            process.env.AI_GROQ_CONCURRENCY || "1",
            10,
          ),
          batchSize: parseInt(process.env.AI_GROQ_BATCH_SIZE || "5", 10),
        },
      };
    }

    await prisma.systemSetting.upsert({
      where: { key: "ai_config" },
      update: { value: newValue },
      create: {
        key: "ai_config",
        value: newValue,
        description: "AI Engine primary and fallback runtime configurations",
      },
    });

    revalidateTag("system-settings", "max");
    return { success: true };
  } catch (error: any) {
    console.error("toggleAiPause error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateUserRole(
  targetUserId: string,
  role: "USER" | "ADMIN",
) {
  await verifyAdmin();

  const session = await auth();
  if (session?.user?.id === targetUserId) {
    return {
      success: false,
      error: "Self-demotion is blocked to prevent administrator lockout.",
    };
  }

  try {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
    });

    await prisma.session.deleteMany({
      where: { userId: targetUserId },
    });

    revalidateTag("users-list", "max");
    return { success: true };
  } catch (error: any) {
    console.error("updateUserRole error:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleUserSuspension(
  targetUserId: string,
  suspended: boolean,
) {
  await verifyAdmin();

  const session = await auth();
  if (session?.user?.id === targetUserId) {
    return {
      success: false,
      error: "Self-suspension is blocked to prevent administrator lockout.",
    };
  }

  try {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { suspended },
    });

    if (suspended) {
      await prisma.session.deleteMany({
        where: { userId: targetUserId },
      });
    }

    revalidateTag("users-list", "max");
    return { success: true };
  } catch (error: any) {
    console.error("toggleUserSuspension error:", error);
    return { success: false, error: error.message };
  }
}


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
