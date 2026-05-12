import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";

/**
 * Parse aiRefinedQuery into structured search groups.
 * Same logic as ingestion-service/topics/sources/internalDb.js — duplicated
 * here because the scan route uses the frontend Prisma client, not the
 * ingestion service's client.
 */
function parseQuery(aiRefinedQuery: string): string[][] {
  if (!aiRefinedQuery?.trim()) return [];

  const orSegments = aiRefinedQuery
    .split(/\s+OR\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const groups: string[][] = [];

  for (const segment of orSegments) {
    const terms: string[] = [];

    const quotedRegex = /"([^"]+)"/g;
    let match;
    let remainder = segment;

    while ((match = quotedRegex.exec(segment)) !== null) {
      const phrase = match[1].trim();
      if (phrase.length > 0) terms.push(phrase);
      remainder = remainder.replace(match[0], " ");
    }

    const bareWords = remainder
      .split(/\s+/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 2);

    terms.push(...bareWords);
    if (terms.length > 0) groups.push(terms);
  }

  return groups;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Fetch the topic
    const topic = await prisma.lockedTopic.findUnique({ where: { id } });
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const groups = parseQuery(topic.aiRefinedQuery);
    if (groups.length === 0) {
      // No valid search terms — mark as scanned with 0 results
      await prisma.lockedTopic.update({
        where: { id },
        data: { lastScannedAt: new Date() },
      });
      revalidateTag(`locked-topic-${id}`, "max");
      revalidateTag("locked-topics", "max");
      return NextResponse.json({ newFindings: 0 });
    }

    // Build Prisma OR conditions from parsed groups
    // Each group: all terms must appear in title OR contentSnippet (AND within group)
    // Groups are OR'd together
    const groupConditions = groups.map((terms) => ({
      AND: terms.map((term) => ({
        OR: [
          {
            rawArticle: {
              title: { contains: term, mode: "insensitive" as const },
            },
          },
          {
            rawArticle: {
              contentSnippet: { contains: term, mode: "insensitive" as const },
            },
          },
        ],
      })),
    }));

    // Query ProcessedArticle — full scan (no sinceDate filter for initial scan route)
    const matches = await prisma.processedArticle.findMany({
      where: { OR: groupConditions },
      include: {
        rawArticle: {
          select: {
            title: true,
            url: true,
            source: true,
            contentSnippet: true,
            publishedAt: true,
          },
        },
      },
      orderBy: { rawArticle: { publishedAt: "desc" } },
      take: 200,
    });

    // Dedup: check which sourceUrls already exist for this topic
    const existingUrls = new Set(
      (
        await prisma.topicFinding.findMany({
          where: { topicId: id },
          select: { sourceUrl: true },
        })
      ).map((f) => f.sourceUrl),
    );

    // Filter out duplicates and prepare findings for insert
    const newFindings = matches.filter(
      (pa) => !existingUrls.has(pa.rawArticle.url),
    );

    // Batch insert new findings
    let insertedCount = 0;
    for (const pa of newFindings) {
      try {
        await prisma.topicFinding.create({
          data: {
            topicId: id,
            sourceType: "ARTICLE",
            sourceName: pa.rawArticle.source,
            sourceUrl: pa.rawArticle.url,
            title: pa.rawArticle.title,
            summary: pa.rawArticle.contentSnippet?.slice(0, 500) || null,
            rawArticleId: pa.id,
            relevanceScore: null, // Will be scored by scorer.js later
          },
        });
        insertedCount++;
      } catch (err) {
        // Unique constraint violation — skip silently (race condition safety)
      }
    }

    // Update topic metadata
    const updateData: Record<string, unknown> = {
      lastScannedAt: new Date(),
    };

    if (insertedCount > 0) {
      updateData.matchCount = { increment: insertedCount };
      updateData.lastMatchedAt = new Date();
    }

    await prisma.lockedTopic.update({
      where: { id },
      data: updateData,
    });

    revalidateTag(`locked-topic-${id}`, "max");
    revalidateTag("locked-topics", "max");

    console.log(
      `🔍 Scan complete for topic "${topic.displayName}": ${insertedCount} new findings from ${matches.length} matches`,
    );

    return NextResponse.json({ newFindings: insertedCount });
  } catch (error) {
    console.error("Scan failed:", error);
    return NextResponse.json({ error: "Failed to scan" }, { status: 500 });
  }
}
