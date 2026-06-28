import prisma from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import fs from "fs/promises";
import path from "path";

export interface SkippedArticleData {
  id: string;
  processedAt: Date;
  rawArticle: {
    id: string;
    title: string;
    contentSnippet: string;
    url: string;
  };
}

export interface FailedEnrichmentData {
  id: string;
  processedAt: Date;
  model: string;
  rawArticle: {
    id: string;
    title: string;
    contentSnippet: string;
    url: string;
    source: string;
  };
}

export interface GazetteerConfig {
  categories: string[];
  regions: string[];
  rawConfig: Record<string, unknown>;
}

export async function getSkippedArticles(
  limit: number = 50,
): Promise<SkippedArticleData[]> {
  "use cache";
  cacheTag("articles");
  cacheLife("minutes");

  try {
    const articles = await prisma.processedArticle.findMany({
      where: {
        clusterStatus: "SKIPPED",
      },
      select: {
        id: true,
        processedAt: true,
        rawArticle: {
          select: {
            id: true,
            title: true,
            contentSnippet: true,
            url: true,
          },
        },
      },
      orderBy: { processedAt: "desc" },
      take: limit,
    });

    return articles as unknown as SkippedArticleData[];
  } catch (error) {
    console.error("getSkippedArticles error:", error);
    return [];
  }
}

export async function getFailedEnrichments(
  limit: number = 50,
): Promise<FailedEnrichmentData[]> {
  "use cache";
  cacheTag("articles");
  cacheLife("minutes");

  try {
    const articles = await prisma.processedArticle.findMany({
      where: {
        clusterStatus: "FAILED_ENRICHMENT",
      },
      select: {
        id: true,
        processedAt: true,
        model: true,
        rawArticle: {
          select: {
            id: true,
            title: true,
            contentSnippet: true,
            url: true,
            source: true,
          },
        },
      },
      orderBy: { processedAt: "desc" },
      take: limit,
    });

    return articles as unknown as FailedEnrichmentData[];
  } catch (error) {
    console.error("getFailedEnrichments error:", error);
    return [];
  }
}

export async function getGazetteerCategoriesAndRegions(): Promise<GazetteerConfig> {
  // We don't cache this using Next.js data cache so it always reads the fresh disk content
  try {
    const gazetteerPath = path.join(
      process.cwd(),
      "../ingestion-service/data/gazetteer.json",
    );
    const fileContent = await fs.readFile(gazetteerPath, "utf-8");
    const config = JSON.parse(fileContent);
    const categories = Object.keys(config.categories || {});
    const regions = Object.keys(config.regions || {});

    return { categories, regions, rawConfig: config };
  } catch (error) {
    console.error("getGazetteerCategoriesAndRegions error:", error);
    return { categories: [], regions: [], rawConfig: {} };
  }
}
