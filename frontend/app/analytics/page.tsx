import {
  getGlobalAnalyticsData,
  getUserAnalyticsData,
} from "@/queries/analytics";
import { auth } from "@/auth";
import { AnalyticsTimeFilter } from "@/components/analytics/AnalyticsTimeFilter";

import {
  formatCompactNumber,
  getSentimentDisplayProps,
} from "@/utils/analytics";
import {
  ScanlineOverlay,
  StatCard,
  SectionHeader,
} from "@/components/analytics/AnalyticsUI";

import {
  EventRegionPanel,
  SentimentSpectrumPanel,
  BiasLeaningPanel,
  CoverageScopePanel,
  SourceGeographyPanel,
  CategoryCoveragePanel,
  TopicSourcePanel,
  TopEntitiesPanel,
} from "@/components/analytics/panels";

// ── Page ───────────────────────────────────────────────────────────────────

interface AnalyticsProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AnalyticsPage(props: AnalyticsProps) {
  const session = await auth();
  const searchParams = await props.searchParams;
  const timeRange =
    typeof searchParams.range === "string" ? searchParams.range : "7d";

  const data = await getGlobalAnalyticsData(timeRange);
  const userData = session?.user?.id
    ? await getUserAnalyticsData(session.user.id, timeRange)
    : null;

  const { label: sentimentLabel, color: sentimentColor } =
    getSentimentDisplayProps(data.avgSentiment);

  const maxEntityCount = data.topEntities[0]?.count ?? 1;
  const maxCountryCount = data.topSourceCountries[0]?.count ?? 1;

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
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 mb-1">
              Corpus Size
            </p>
            <p className="text-5xl font-black font-mono tracking-tighter text-foreground">
              {formatCompactNumber(data.totalArticles)}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">
              processed articles
            </p>
          </div>
        </div>

        {/* ── Summary stats ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Story Clusters"
            value={formatCompactNumber(data.totalStories)}
            sub="Active narratives"
            accent="#3b82f6"
          />

          {userData && (
            <>
              <StatCard
                label="Locked Topics"
                value={formatCompactNumber(userData.totalTopics)}
                sub="Surveillance ops"
                accent="#10b981"
              />
              <StatCard
                label="Total Findings"
                value={formatCompactNumber(userData.totalFindings)}
                sub="Across all trackers"
                accent="#f59e0b"
              />
            </>
          )}

          <StatCard
            label="Avg. Sentiment"
            value={sentimentLabel}
            sub={
              data.avgSentiment != null
                ? `Score: ${data.avgSentiment.toFixed(3)}`
                : undefined
            }
            accent={sentimentColor}
          />
        </div>

        {/* ── Section: News Intelligence ───────────────────────────────── */}
        <section className="space-y-6">
          <SectionHeader
            title="News Intelligence"
            sub="Bias & Coverage Distribution"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EventRegionPanel data={data.eventRegionDistribution} />
            <SentimentSpectrumPanel data={data.sentimentDistribution} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BiasLeaningPanel data={data.biasGroupDistribution} />
            <CoverageScopePanel data={data.coverageScopeDistribution} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SourceGeographyPanel
              data={data.topSourceCountries}
              maxCountryCount={maxCountryCount}
            />
            <CategoryCoveragePanel data={data.categoryBreakdown} />
          </div>
        </section>

        {/* ── Section: Topics & Narratives ───────────────────────────────── */}
        <section className="space-y-6">
          <SectionHeader
            title="Topics & Narratives"
            sub="Entities, Sources & Impact"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {userData && (
              <TopicSourcePanel
                data={userData.topicSourceDistribution}
                className="lg:col-span-1"
              />
            )}

            <TopEntitiesPanel
              data={data.topEntities}
              maxEntityCount={maxEntityCount}
              className={userData ? "lg:col-span-2" : "lg:col-span-3"}
            />
          </div>
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
