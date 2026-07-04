import { AnalyticsTimeFilter } from "@/components/analytics/AnalyticsTimeFilter";
import {
  ScanlineOverlay,
  SectionHeader,
} from "@/components/analytics/AnalyticsUI";
import { CorpusSizeContainer } from "@/components/analytics/containers/CorpusSizeContainer";
import { NewsIntelligenceContainer } from "@/components/analytics/containers/NewsIntelligenceContainer";
import { SummaryStatsContainer } from "@/components/analytics/containers/SummaryStatsContainer";
import { TopicsNarrativesContainer } from "@/components/analytics/containers/TopicsNarrativesContainer";
import { CorpusSizeSkeleton } from "@/components/skeletons/analytics/CorpusSizeSkeleton";
import { NewsIntelligenceSkeleton } from "@/components/skeletons/analytics/NewsIntelligenceSkeleton";
import { SummaryStatsSkeleton } from "@/components/skeletons/analytics/SummaryStatsSkeleton";
import { TopicsNarrativesSkeleton } from "@/components/skeletons/analytics/TopicsNarrativesSkeleton";
import { Suspense } from "react";

// ── Page ───────────────────────────────────────────────────────────────────

interface AnalyticsProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function AnalyticsPage(props: AnalyticsProps) {
  return (
    <div className="relative min-h-full bg-background pb-20">
      <ScanlineOverlay />

      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 blur-[100px] rounded-full" />

      <div className="relative z-10 mx-auto w-full max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse delay-75" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/30 animate-pulse delay-150" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/60">
                Command Center Intelligence
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-4">
              Analytics
              <span className="text-primary">.</span>
            </h1>
            <AnalyticsTimeFilter />
          </div>

          <div className="text-left md:text-right">
            <Suspense fallback={<CorpusSizeSkeleton />}>
              <CorpusSizeContainer searchParams={props.searchParams} />
            </Suspense>
          </div>
        </div>

        {/* ── Summary stats ────────────────────────────────────────────── */}
        <Suspense fallback={<SummaryStatsSkeleton />}>
          <SummaryStatsContainer searchParams={props.searchParams} />
        </Suspense>

        {/* ── Section: News Intelligence ───────────────────────────────── */}
        <section className="space-y-6">
          <SectionHeader
            title="News Intelligence"
            sub="Bias & Coverage Distribution"
          />

          <Suspense fallback={<NewsIntelligenceSkeleton />}>
            <NewsIntelligenceContainer searchParams={props.searchParams} />
          </Suspense>
        </section>

        {/* ── Section: Topics & Narratives ───────────────────────────────── */}
        <section className="space-y-6">
          <SectionHeader
            title="Topics & Narratives"
            sub="Entities, Sources & Impact"
          />

          <Suspense fallback={<TopicsNarrativesSkeleton />}>
            <TopicsNarrativesContainer searchParams={props.searchParams} />
          </Suspense>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <div className="flex-1 h-px bg-border/20" />
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
            Global News Aggregator · Intelligence Layer
          </span>
          <div className="flex-1 h-px bg-border/20" />
        </div>
      </div>
    </div>
  );
}
