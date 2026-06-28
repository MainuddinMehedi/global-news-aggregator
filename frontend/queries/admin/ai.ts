import prisma from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

export interface AiConfigSettings {
  pauseAI: boolean;
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
}

export interface AiUsageDataPoint {
  date: string;
  tokensUsed: number;
  estimatedCost: number;
  provider: string;
  model: string;
}

export async function getAiConfigSettings(): Promise<AiConfigSettings> {
  "use cache";
  cacheTag("system-settings");
  cacheLife("minutes");

  const defaults: AiConfigSettings = {
    pauseAI: false,
    primary: {
      model: process.env.AI_PIPELINE_MODEL || "mistral-small-2506",
      tpmLimit: parseInt(process.env.AI_MISTRAL_TPM_LIMIT || "2250000", 10),
      rpmLimit: parseInt(process.env.AI_MISTRAL_RPM_LIMIT || "60", 10),
      concurrencyLimit: parseInt(process.env.AI_MISTRAL_CONCURRENCY || "5", 10),
      batchSize: parseInt(process.env.AI_MISTRAL_BATCH_SIZE || "10", 10),
    },
    fallback: {
      model:
        process.env.AI_PIPELINE_FALLBACK_MODEL ||
        "meta-llama/llama-4-scout-17b-16e-instruct",
      tpmLimit: parseInt(process.env.AI_GROQ_TPM_LIMIT || "30000", 10),
      rpmLimit: parseInt(process.env.AI_GROQ_RPM_LIMIT || "28", 10),
      concurrencyLimit: parseInt(process.env.AI_GROQ_CONCURRENCY || "1", 10),
      batchSize: parseInt(process.env.AI_GROQ_BATCH_SIZE || "5", 10),
    },
  };

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "ai_config" },
    });

    if (!setting) {
      return defaults;
    }

    const value = setting.value as unknown as Partial<AiConfigSettings>;
    return {
      pauseAI:
        typeof value.pauseAI === "boolean" ? value.pauseAI : defaults.pauseAI,
      primary: {
        model: value.primary?.model || defaults.primary.model,
        tpmLimit:
          typeof value.primary?.tpmLimit === "number"
            ? value.primary.tpmLimit
            : defaults.primary.tpmLimit,
        rpmLimit:
          typeof value.primary?.rpmLimit === "number"
            ? value.primary.rpmLimit
            : defaults.primary.rpmLimit,
        concurrencyLimit:
          typeof value.primary?.concurrencyLimit === "number"
            ? value.primary.concurrencyLimit
            : defaults.primary.concurrencyLimit,
        batchSize:
          typeof value.primary?.batchSize === "number"
            ? value.primary.batchSize
            : defaults.primary.batchSize,
      },
      fallback: {
        model: value.fallback?.model || defaults.fallback.model,
        tpmLimit:
          typeof value.fallback?.tpmLimit === "number"
            ? value.fallback.tpmLimit
            : defaults.fallback.tpmLimit,
        rpmLimit:
          typeof value.fallback?.rpmLimit === "number"
            ? value.fallback.rpmLimit
            : defaults.fallback.rpmLimit,
        concurrencyLimit:
          typeof value.fallback?.concurrencyLimit === "number"
            ? value.fallback.concurrencyLimit
            : defaults.fallback.concurrencyLimit,
        batchSize:
          typeof value.fallback?.batchSize === "number"
            ? value.fallback.batchSize
            : defaults.fallback.batchSize,
      },
    };
  } catch (error) {
    console.error("getAiConfigSettings error:", error);
    return defaults;
  }
}

export async function getAiUsageTimeline(
  daysToChart: number = 30,
): Promise<AiUsageDataPoint[]> {
  "use cache";
  cacheTag("ai-usage");
  cacheLife("hours");

  const chartStartDate = new Date(
    Date.now() - daysToChart * 24 * 60 * 60 * 1000,
  );
  try {
    const rawUsage = await prisma.aiUsage.findMany({
      where: {
        createdAt: { gte: chartStartDate },
      },
      orderBy: { date: "asc" },
      select: {
        date: true,
        tokensUsed: true,
        estimatedCost: true,
        provider: true,
        model: true,
      },
    });

    return rawUsage as AiUsageDataPoint[];
  } catch (error) {
    console.error("getAiUsageTimeline error:", error);
    return [];
  }
}
