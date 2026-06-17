# Story DB Baseline Audit

> **Relations:** See [0. story-clustering.md](0.%20story-clustering.md) for the feature overview, [Story clustering implementation plan - solving current problems](Story%20clustering%20implementation%20plan%20-%20solving%20current%20problems.md) for Phase 1 changes this audit measures.
> **Status:** ✅ Completed — Baseline established.

## Purpose

Establish a baseline snapshot of the current StoryCluster and ProcessedArticle tables before Phase 1 clustering changes produce new behavior. Compare against this baseline after 2-4 weeks of Phase 1 runs to measure differences in story count, status distribution, impact distribution, and article assignments.

## How to Run

From the `ingestion-service/` directory:

```bash
node db-audit.mjs
```

## Audit Script

Save the following as `ingestion-service/db-audit.mjs` and run it. It is read-only.

```js
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@news/db";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function audit() {
  // --- STORYCLUSTER STATS ---
  const totalStories = await prisma.storyCluster.count();
  const activeStories = await prisma.storyCluster.count({ where: { isActive: true } });
  const inactiveStories = await prisma.storyCluster.count({ where: { isActive: false } });

  // Distribution by impact
  const byImpact = await prisma.storyCluster.groupBy({
    by: ["impact"],
    _count: true,
    where: { isActive: true },
  });

  // Distribution by status
  const byStatus = await prisma.storyCluster.groupBy({
    by: ["status"],
    _count: true,
    where: { isActive: true },
  });

  // All stories with key fields
  const stories = await prisma.storyCluster.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, status: true, impact: true,
      isActive: true, articleCount: true, sourceCount: true,
      momentumScore: true, lastActivityAt: true, createdAt: true, updatedAt: true,
    },
  });

  // --- PROCESSEDARTICLE STATS ---
  const totalArticles = await prisma.processedArticle.count();
  const byClusterStatus = await prisma.processedArticle.groupBy({
    by: ["clusterStatus"],
    _count: true,
  });

  // --- ANOMALIES ---
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeButStale = await prisma.storyCluster.count({
    where: { isActive: true, lastActivityAt: { lt: thirtyDaysAgo } },
  });
  const inactiveButRecent = await prisma.storyCluster.count({
    where: { isActive: false, lastActivityAt: { gte: thirtyDaysAgo } },
  });
  const zeroArticleStories = stories.filter((s) => s.articleCount === 0).length;

  // --- OUTPUT ---
  const output = {
    date: new Date().toISOString(),
    storyCluster: {
      total: totalStories,
      active: activeStories,
      inactive: inactiveStories,
      activeByImpact: byImpact,
      activeByStatus: byStatus,
      anomalies: { activeButStale_gt30days: activeButStale, inactiveButRecent_lt30days: inactiveButRecent, zeroArticleStories },
    },
    processedArticle: {
      total: totalArticles,
      byClusterStatus: byClusterStatus,
    },
    allStories: stories,
  };

  console.log(JSON.stringify(output, null, 2));
  await prisma.$disconnect();
}

audit();
```

## Baseline Fields to Track

| Metric | Phase 0 (Baseline) | Phase 1 (After 2-4 weeks) |
|--------|-------------------|--------------------------|
| Total stories | 5 | |
| Active stories | 5 | |
| Inactive stories | 0 | |
| Active by impact (C/H/M/L) | H: 2, M: 3 | |
| Active by status (E/DE/ES/SB/S/R) | DE: 4, ES: 1 | |
| Active but stale (>30d no activity) | 0 | |
| Stories with 0 articles | 0 | |
| Total processed articles | 372 | |
| HOLDING articles | 166 | |
| CLUSTERED articles | 41 | |
| ARCHIVED_UNCLUSTERED / SKIPPED | SKIPPED: 165 | |

## Expected Changes After Phase 1

- Active story count may increase (no momentum-based archival).
- More stories with `SLOW_BURN` and `EMERGING` statuses.
- Holding window shift from 48h to 168h means more HOLDING articles.
- Story/article distribution may look healthier as lifecycle rules stabilize.
