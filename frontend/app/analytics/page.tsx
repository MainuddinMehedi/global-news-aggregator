import { getAnalyticsData } from "@/queries/analytics";
import { cn } from "@/lib/utils";
import { BiasDonutChart } from "@/components/widgets/charts/BiasDonutChart";
import { SentimentBarChart } from "@/components/widgets/charts/SentimentBarChart";
import { CategoryBarChart } from "@/components/widgets/charts/CategoryBarChart";
import { AiUsageLineChart } from "@/components/widgets/charts/AiUsageLineChart";
import { IngestionVolumeChart } from "@/components/widgets/charts/IngestionVolumeChart";
import { SourceStatusIndicator } from "@/components/widgets/SourceStatusIndicator";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { AnalyticsTimeFilter } from "@/components/widgets/AnalyticsTimeFilter";
import { ModelUtilizationChart } from "@/components/widgets/charts/ModelUtilizationChart";
import { TopicSourceDistributionChart } from "@/components/widgets/charts/TopicSourceDistributionChart";
import { ChatTelemetryWidget } from "@/components/widgets/ChatTelemetryWidget";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function formatCost(n: number): string {
  return `$${n.toFixed(4)}`;
}

// ── Components ─────────────────────────────────────────────────────────────

function ScanlineOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)",
      }}
    />
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm p-5 group hover:border-primary/40 transition-all duration-300">
      <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <p
        className="text-[9px] font-black uppercase tracking-[0.3em] mb-3"
        style={{ color: accent ?? "var(--muted-foreground)" }}
      >
        {label}
      </p>
      <p className="text-4xl font-black tracking-tighter text-foreground font-mono leading-none">
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-muted-foreground mt-2 font-medium">
          {sub}
        </p>
      )}
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-primary opacity-80" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground">
          {title}
        </h2>
      </div>
      {sub && (
        <span className="text-[9px] text-muted-foreground/50 font-mono">
          {sub}
        </span>
      )}
      <div className="flex-1 h-px bg-border/30" />
    </div>
  );
}

function PanelShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/40 bg-card/20 backdrop-blur-sm p-6",
        className,
      )}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary/30 rounded-tl-2xl" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary/30 rounded-tr-2xl" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-primary/30 rounded-bl-2xl" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-primary/30 rounded-br-2xl" />
      {children}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function AnalyticsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const timeRange = typeof searchParams.range === "string" ? searchParams.range : "7d";
  
  const data = await getAnalyticsData(timeRange);

  const sentimentLabel =
    data.avgSentiment == null
      ? "No data"
      : data.avgSentiment > 0.2
        ? "Positive"
        : data.avgSentiment < -0.2
          ? "Negative"
          : "Neutral";

  const sentimentColor =
    data.avgSentiment == null
      ? "#6b7280"
      : data.avgSentiment > 0.2
        ? "#10b981"
        : data.avgSentiment < -0.2
          ? "#ef4444"
          : "#f59e0b";

  const maxEntityCount = data.topEntities[0]?.count ?? 1;
  const maxCountryCount = data.topSourceCountries[0]?.count ?? 1;

  const totalAiTokens = data.aiUsageChart.reduce(
    (s, d) => s + d.tokensUsed,
    0,
  );
  const totalAiCost = data.aiUsageChart.reduce(
    (s, d) => s + d.estimatedCost,
    0,
  );

  return (
    <div className="relative min-h-full bg-background pb-20">
      <ScanlineOverlay />

      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 blur-[100px] rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
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
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 mb-1">
              Corpus Size
            </div>
            <div className="text-5xl font-black font-mono tracking-tighter text-foreground">
              {formatNumber(data.totalArticles)}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono mt-1">
              processed articles
            </div>
          </div>
        </div>

        {/* ── Summary stats ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Story Clusters"
            value={formatNumber(data.totalStories)}
            sub="Active narratives"
            accent="#3b82f6"
          />
          <StatCard
            label="Locked Topics"
            value={formatNumber(data.totalTopics)}
            sub="Surveillance ops"
            accent="#10b981"
          />
          <StatCard
            label="Total Findings"
            value={formatNumber(data.totalFindings)}
            sub="Across all trackers"
            accent="#f59e0b"
          />
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

        {/* ── Section: System Vitality ─────────────────────────────────── */}
        <section className="space-y-6">
          <SectionHeader
            title="System Vitality"
            sub="Ingestion & Health Metrics"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Source Health Table */}
            <PanelShell className="lg:col-span-1 flex flex-col">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 px-1">
                Source Health
              </h3>

              <div className="flex items-center justify-between mb-5 px-1">
                <div className="space-y-1">
                  <p className="text-4xl font-black tracking-tighter text-foreground font-mono">
                    {data.sourceHealth.length}
                  </p>
                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                    Active Sources
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-4xl font-black tracking-tighter text-emerald-500 font-mono">
                    {data.dedupRate}%
                  </p>
                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                    Dedup Rate
                  </p>
                </div>
              </div>

              <div className="h-px w-full bg-border/20 mb-8" />

              <div className="flex-1 space-y-4">
                {data.sourceHealth.length > 0 ? data.sourceHealth.slice(0, 6).map((source) => (
                  <div
                    key={source.name}
                    className="flex items-center justify-between group px-1"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <SourceStatusIndicator lastFetch={source.lastFetch} />
                      <span className="text-[12px] font-bold text-foreground/90 group-hover:text-primary transition-colors truncate">
                        {source.name}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-[10px] font-mono text-foreground/80 font-black leading-tight">
                        {source.count} articles
                      </p>
                      <RelativeTime
                        date={source.lastFetch}
                        className="text-[9px] text-muted-foreground/60 font-medium"
                      />
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground/50 italic text-center">No active sources in this timeframe.</p>
                )}
              </div>
            </PanelShell>

            {/* Ingestion Volume Chart */}
            <PanelShell className="lg:col-span-2 flex flex-col">
              <div className="flex items-center justify-between mb-6 px-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Ingestion Volume
                </p>
                <p className="text-[9px] text-muted-foreground/60 font-mono italic">
                  Daily Fetch vs Processed
                </p>
              </div>
              <div className="flex-1 w-full min-h-[320px]">
                {data.ingestionVolumeChart.length > 0 ? (
                  <IngestionVolumeChart data={data.ingestionVolumeChart} />
                ) : (
                  <p className="text-xs text-muted-foreground/50 italic text-center mt-20">No ingestion data available.</p>
                )}
              </div>
            </PanelShell>
          </div>
        </section>

        {/* ── Section: Command Telemetry ───────────────────────────────── */}
        <section className="space-y-6">
          <SectionHeader
            title="Command Telemetry"
            sub="Agent Chat & Interactions"
          />
          <ChatTelemetryWidget data={data.chatTelemetry} />
        </section>

        {/* ── Section: News Intelligence ───────────────────────────────── */}
        <section className="space-y-6">
          <SectionHeader
            title="News Intelligence"
            sub="Bias & Coverage Distribution"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bias Distribution */}
            <PanelShell>
              <SectionHeader
                title="Bias Distribution"
                sub="Interactive Donut Analysis"
              />
              {data.biasDistribution.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <BiasDonutChart data={data.biasDistribution} />
                  <div className="w-full md:w-48 space-y-2">
                    {data.biasDistribution.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-black font-mono text-foreground/80">
                          {item.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/50 italic py-10 text-center">No bias data available.</p>
              )}
            </PanelShell>

            {/* Sentiment Distribution */}
            <PanelShell>
              <SectionHeader
                title="Sentiment Spectrum"
                sub="5-Bucket Distribution"
              />
              <SentimentBarChart data={data.sentimentDistribution} />
            </PanelShell>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Source Countries */}
            <PanelShell>
              <SectionHeader title="Source Geography" />
              {data.topSourceCountries.length > 0 ? (
                <div className="space-y-2.5">
                  {data.topSourceCountries.map((item, i) => (
                    <div key={item.country} className="flex items-center gap-3">
                      <span className="text-[9px] font-black font-mono text-muted-foreground/40 w-4 text-right">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-foreground/80">
                            {item.country}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {item.count.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1 w-full bg-border/20 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/60 transition-all duration-1000"
                            style={{
                              width: `${(item.count / maxCountryCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] font-black font-mono text-primary/60 w-8 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/50 italic py-10 text-center">No geography data available.</p>
              )}
            </PanelShell>

            {/* Category Breakdown */}
            <PanelShell>
              <SectionHeader
                title="Coverage by Category"
                sub="Top 8 Categories"
              />
              {data.categoryBreakdown.length > 0 ? (
                <CategoryBarChart data={data.categoryBreakdown} />
              ) : (
                <p className="text-xs text-muted-foreground/50 italic py-10 text-center">No category data available.</p>
              )}
            </PanelShell>
          </div>
        </section>

        {/* ── Section: Topics & Narratives ───────────────────────────────── */}
        <section className="space-y-6">
          <SectionHeader
            title="Topics & Narratives"
            sub="Entities, Sources & Impact"
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PanelShell className="lg:col-span-1">
              <SectionHeader title="Topic Sources" />
              <TopicSourceDistributionChart data={data.topicSourceDistribution} />
            </PanelShell>

            <PanelShell className="lg:col-span-2">
              <SectionHeader title="Top Entities" />
              {data.topEntities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.topEntities.map((item) => {
                    const intensity = Math.round(
                      (item.count / maxEntityCount) * 100,
                    );
                    return (
                      <div
                        key={item.entity}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/30 bg-card/30 hover:border-primary/40 transition-colors group"
                      >
                        <span className="text-xs font-bold text-foreground/80 group-hover:text-foreground transition-colors">
                          {item.entity}
                        </span>
                        <span
                          className="text-[9px] font-black font-mono px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `oklch(from var(--primary) l c h / ${(intensity / 100) * 0.25})`,
                            color: `oklch(from var(--primary) l c h / 0.8)`,
                          }}
                        >
                          {item.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/50 italic py-4 text-center">
                  No entity data yet. Articles need AI processing.
                </p>
              )}
            </PanelShell>
          </div>
        </section>

        {/* ── Section: AI Intelligence ──────────────────────────────────── */}
        <section className="space-y-6">
          <SectionHeader
            title="AI Architecture"
            sub="Pipeline Cost & Utilization"
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PanelShell className="lg:col-span-1">
              <SectionHeader title="Model Utilization" />
              {data.modelUtilization.length > 0 ? (
                <ModelUtilizationChart data={data.modelUtilization} />
              ) : (
                <p className="text-xs text-muted-foreground/50 italic py-10 text-center">No AI model utilization logged.</p>
              )}
            </PanelShell>

            <PanelShell className="lg:col-span-2">
              <SectionHeader
                title="AI Usage Pipeline"
                sub="Token & Cost Area Analysis"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-1">
                    Total Tokens
                  </div>
                  <div className="text-2xl font-black font-mono text-foreground">
                    {formatNumber(totalAiTokens)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-1">
                    Est. Cost
                  </div>
                  <div className="text-2xl font-black font-mono text-foreground">
                    {formatCost(totalAiCost)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-1">
                    Runs
                  </div>
                  <div className="text-2xl font-black font-mono text-foreground">
                    {data.aiUsageChart.length}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-1">
                    Avg / Day
                  </div>
                  <div className="text-2xl font-black font-mono text-foreground">
                    {data.aiUsageChart.length > 0
                      ? formatNumber(
                          Math.round(
                            totalAiTokens / data.aiUsageChart.length,
                          ),
                        )
                      : "—"}
                  </div>
                </div>
              </div>

              {data.aiUsageChart.length > 0 ? (
                <div className="h-64">
                  <AiUsageLineChart data={data.aiUsageChart} />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/50 italic py-4 text-center">
                  No AI usage data in this timeframe.
                </p>
              )}
            </PanelShell>
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
