# Loading Skeletons & Next.js Routing Conventions

This document specifies the architecture, placement, and design system alignment for page loading skeletons in the Global News Aggregator.

## Core Principles

1. **Layout-Matching Skeletons**: Skeletons must match the final loaded component layout grid, sizes, padding, and constraints exactly to prevent layout shifts (CLS) when data hydration completes.
2. **Next.js Native Routing (`loading.tsx`)**:
   - Prefer Next.js native `loading.tsx` files at the route level instead of manual `<Suspense>` wrappers around page components inside `page.tsx`.
   - Page components should be declared `async` directly so that Next.js streams the response and triggers the route's `loading.tsx` skeleton.
3. **No Inline Skeletons**: Skeletons must not be buried inline inside components or pages. Extract them into reusable modular files in their respective folders:
   - Topic findings: `FindingSkeleton` in [FindingSkeleton.tsx](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/frontend/components/locked-topics/FindingSkeleton.tsx).
   - Article detail page: `ArticleDetailsSkeleton` in [ArticleSkeleton.tsx](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/frontend/components/articles/ArticleSkeleton.tsx).
   - Story detail page: `StoryDetailsSkeleton` in [StorySkeleton.tsx](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/frontend/components/stories/StorySkeleton.tsx).
4. **Theme Alignment**: Skeletons must use the Tailwind `animate-pulse` class and the standard `Skeleton` component from `@/components/ui/skeleton` rather than custom background/border classes.

## Directory Mapping

| Route | Page File | Loading File / Component |
|---|---|---|
| `/` | `app/page.tsx` | `app/loading.tsx` -> `components/Feed/FeedSkeleton.tsx` |
| `/article/[slug]` | `app/article/[slug]/page.tsx` | `<ArticleDetailsSkeleton />` (in `page.tsx` Suspense) |
| `/stories` | `app/stories/page.tsx` | `app/stories/loading.tsx` |
| `/stories/[slug]` | `app/stories/[slug]/page.tsx` | `<StoryDetailsSkeleton />` (in `page.tsx` Suspense) |
| `/analytics` | `app/analytics/page.tsx` | `app/analytics/loading.tsx` (Triggered via `async` page) |
| `/locked-topics` | `app/locked-topics/page.tsx` | `app/locked-topics/loading.tsx` |
| `/locked-topics/[id]` | `app/locked-topics/[id]/page.tsx` | `app/locked-topics/[id]/loading.tsx` (Triggered via `async` page) |
| `/system-supar-admin` | `app/system-supar-admin/page.tsx` | `app/system-supar-admin/loading.tsx` |
| `/bookmarks` | `app/bookmarks/page.tsx` | `app/bookmarks/loading.tsx` & client fallback |
