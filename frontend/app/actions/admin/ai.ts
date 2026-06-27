"use server";

import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { verifyAdmin } from "./varifyAdmin";

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
