import { getAnalyticsData } from "@/queries/analytics";
import { cn } from "@/lib/utils";
import { BiasDonutChart } from "@/components/widgets/charts/BiasDonutChart";
import { SentimentBarChart } from "@/components/widgets/charts/SentimentBarChart";
import { CategoryBarChart } from "@/components/widgets/charts/CategoryBarChart";
import { AnalyticsTimeFilter } from "@/components/widgets/AnalyticsTimeFilter";
import { TopicSourceDistributionChart } from "@/components/widgets/charts/TopicSourceDistributionChart";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
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

interface AnalyticsProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AnalyticsPage(props: AnalyticsProps) {
  return <AnalyticsPageContent searchParams={props.searchParams} />;
}

async function AnalyticsPageContent(props: AnalyticsProps) {
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



        {/* ── Section: News Intelligence ───────────────────────────────── */}
        <section className="space-y-6">
          <SectionHeader
            title="News Intelligence"
            sub="Bias & Coverage Distribution"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Region Distribution */}
            <PanelShell>
              <SectionHeader
                title="Event Region Distribution"
                sub="Interactive Donut Analysis"
              />
              {data.eventRegionDistribution.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <BiasDonutChart data={data.eventRegionDistribution} filterParam="region" />
                  <div className="w-full md:w-48 space-y-2">
                    {data.eventRegionDistribution.map((item) => (
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
                <p className="text-xs text-muted-foreground/50 italic py-10 text-center">No event region data available.</p>
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
            {/* Bias Leaning Distribution */}
            <PanelShell>
              <SectionHeader
                title="Bias Leaning Distribution"
                sub="Publisher Ideological Lenses"
              />
              {data.biasGroupDistribution.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <BiasDonutChart
                    filterParam="bias"
                    data={data.biasGroupDistribution.map(item => ({
                      label: item.label,
                      count: item.count,
                      percentage: item.percentage,
                      color: item.label === "Centrist" ? "#10b981" :
                             item.label === "Left-leaning" ? "#3b82f6" :
                             item.label === "Right-leaning" ? "#ef4444" :
                             item.label === "State-Aligned" ? "#f59e0b" :
                             item.label === "State-Controlled" ? "#8b5cf6" : "#6b7280"
                    }))}
                  />
                  <div className="w-full md:w-48 space-y-2">
                    {data.biasGroupDistribution.map((item) => {
                      const color = item.label === "Centrist" ? "#10b981" :
                                    item.label === "Left-leaning" ? "#3b82f6" :
                                    item.label === "Right-leaning" ? "#ef4444" :
                                    item.label === "State-Aligned" ? "#f59e0b" :
                                    item.label === "State-Controlled" ? "#8b5cf6" : "#6b7280";
                      return (
                        <div
                          key={item.label}
                          className="flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">
                              {item.label}
                            </span>
                          </div>
                          <span className="text-[10px] font-black font-mono text-foreground/80">
                            {item.percentage}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/50 italic py-10 text-center">No bias leaning data available.</p>
              )}
            </PanelShell>

            {/* Coverage Scope Distribution */}
            <PanelShell>
              <SectionHeader
                title="Coverage Scope Distribution"
                sub="Publisher Reporting Reach"
              />
              {data.coverageScopeDistribution.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <BiasDonutChart
                    filterParam="scope"
                    data={data.coverageScopeDistribution.map(item => ({
                      label: item.label,
                      count: item.count,
                      percentage: item.percentage,
                      color: item.label === "Global" ? "#10b981" :
                             item.label === "Regional" ? "#3b82f6" :
                             item.label === "National" ? "#f59e0b" : "#6b7280"
                    }))}
                  />
                  <div className="w-full md:w-48 space-y-2">
                    {data.coverageScopeDistribution.map((item) => {
                      const color = item.label === "Global" ? "#10b981" :
                                    item.label === "Regional" ? "#3b82f6" :
                                    item.label === "National" ? "#f59e0b" : "#6b7280";
                      return (
                        <div
                          key={item.label}
                          className="flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">
                              {item.label}
                            </span>
                          </div>
                          <span className="text-[10px] font-black font-mono text-foreground/80">
                            {item.percentage}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/50 italic py-10 text-center">No coverage scope data available.</p>
              )}
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
