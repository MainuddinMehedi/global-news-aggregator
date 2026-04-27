import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total articles
    const totalArticles = await prisma.rawArticle.count();
    const articlesToday = await prisma.rawArticle.count({
      where: { fetchedAt: { gte: today } },
    });

    // Processed articles count
    const processedCount = await prisma.processedArticle.count();

    // Bias category distribution
    const biasDistribution = await prisma.processedArticle.groupBy({
      by: ["biasCategory"],
      _count: { id: true },
    });

    // Category distribution
    const categories = await prisma.category.findMany({
      include: { _count: { select: { articles: true } } },
      orderBy: { articles: { _count: "desc" } },
      take: 10,
    });

    // AI usage this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const aiUsage = await prisma.aiUsage.aggregate({
      where: { date: { gte: monthStart } },
      _sum: { tokensUsed: true, estimatedCost: true },
      _count: { id: true },
    });

    // Average sentiment
    const avgSentiment = await prisma.processedArticle.aggregate({
      _avg: { sentimentScore: true },
    });

    return NextResponse.json({
      totalArticles,
      articlesToday,
      processedCount,
      processedPct:
        totalArticles > 0
          ? ((processedCount / totalArticles) * 100).toFixed(1)
          : "0",
      biasDistribution: biasDistribution.map((b) => ({
        category: b.biasCategory || "Unknown",
        count: b._count.id,
      })),
      categories: categories.map((c) => ({
        name: c.name,
        count: c._count.articles,
      })),
      aiCostMonth: aiUsage._sum.estimatedCost?.toFixed(4) || "0",
      aiTokensMonth: aiUsage._sum.tokensUsed || 0,
      aiCallsMonth: aiUsage._count.id || 0,
      avgSentiment: avgSentiment._avg.sentimentScore?.toFixed(2) || "N/A",
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
