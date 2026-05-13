import { LockedTopic } from "@/types/lockedTopic";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Brain01Icon,
  NewsIcon,
  Message01Icon,
  Chart01Icon,
} from "@hugeicons/core-free-icons";

export function TopicDetailsView({ topic }: { topic: LockedTopic }) {
  const decodedTopic = topic.displayName;

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto overflow-x-hidden text-foreground no-scrollbar">
      {/* Hero/Summary Header */}
      <div className="relative border-b border-border/50 bg-muted/10 px-6 py-8 sm:px-10">
        <div className="absolute top-0 left-0 h-full w-full bg-linear-to-br from-primary/10 to-transparent opacity-50" />
        <div className="relative z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary shadow-sm backdrop-blur-md">
            <HugeiconsIcon icon={Brain01Icon} className="h-3.5 w-3.5" />
            AI Analysis
          </div>
          <h2 className="mb-2 text-3xl font-bold tracking-tight capitalize sm:text-4xl">
            {decodedTopic}
          </h2>
          <p className="max-w-3xl leading-relaxed text-muted-foreground">
            {topic.liveWebSummary ||
              "Live intelligence gathering in progress. A synthesis of the current situational reality will appear here shortly after the next scan."}
          </p>
        </div>
      </div>

      {/* Bento Grid Content */}
      <div className="grid gap-6 p-6 sm:px-10 md:grid-cols-3">
        {/* Trends & Metrics */}
        <div className="col-span-1 flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/30 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            <HugeiconsIcon icon={Chart01Icon} className="h-4 w-4" />
            Momentum
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-bold">120</span>
            <span className="mb-1 text-sm text-muted-foreground">
              matches / 24h
            </span>
          </div>
          {/* Mock Chart */}
          <div className="mt-4 flex h-20 items-end gap-1.5 opacity-80">
            {[20, 35, 25, 45, 60, 80, 100, 85, 120].map((h, i) => (
              <div
                key={i}
                className="w-full rounded-t-sm bg-primary/40 transition-all hover:bg-primary"
                style={{ height: `${Math.min(h, 100)}%` }}
              />
            ))}
          </div>
        </div>

        {/* Opinions & Bias */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/30 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            <HugeiconsIcon icon={Message01Icon} className="h-4 w-4" />
            Perspectives
          </div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-muted/40 p-4">
              <h4 className="mb-1 text-sm font-bold">State Media Bias</h4>
              <p className="text-xs text-muted-foreground">
                High volume of articles leaning towards state-sponsored
                narratives.
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <h4 className="mb-1 text-sm font-bold">Independent Reports</h4>
              <p className="text-xs text-muted-foreground">
                Emerging cluster focusing on humanitarian impacts and long-term
                economic effects.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Articles */}
        <div className="col-span-1 md:col-span-3 flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/30 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            <HugeiconsIcon icon={NewsIcon} className="h-4 w-4" />
            Latest Articles
          </div>
          <div className="mt-2 flex flex-col gap-3">
            {[
              {
                source: "Al Jazeera",
                title: "Diplomatic talks stall as new conditions emerge",
                time: "2h ago",
              },
              {
                source: "Reuters",
                title: "Market reactions to recent border skirmishes",
                time: "4h ago",
              },
              {
                source: "Bloomberg",
                title: "Oil prices fluctuate amidst regional uncertainty",
                time: "5h ago",
              },
            ].map((art, i) => (
              <div
                key={i}
                className="group flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/30 bg-background/50 p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    {art.source}
                  </span>
                  <span className="text-sm font-medium transition-colors group-hover:text-primary">
                    {art.title}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {art.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
