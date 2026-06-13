"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { Globe, Alert01Icon, Sparkles } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface ArticleData {
  id: string;
  source: string;
  sentimentScore: number | null;
  sourceOrigin: string | null;
  sourceType: string | null;
  biasGroup: string | null;
}

interface PerspectiveWidgetProps {
  articles: ArticleData[];
}

interface RegionAggregate {
  origin: string;
  count: number;
  avgSentiment: number;
  sources: {
    name: string;
    type: string | null;
    bias: string | null;
  }[];
}

const REGION_COLORS: Record<string, string> = {
  "North America": "bg-blue-500 shadow-blue-500/30",
  "Europe": "bg-emerald-500 shadow-emerald-500/30",
  "Middle East": "bg-red-500 shadow-red-500/30",
  "Asia-Pacific": "bg-amber-500 shadow-amber-500/30",
  "Latin America": "bg-purple-500 shadow-purple-500/30",
  "Africa": "bg-pink-500 shadow-pink-500/30",
  "Global": "bg-slate-400 shadow-slate-400/30",
  "Unknown": "bg-gray-400 shadow-gray-400/30",
};

export function PerspectiveWidget({ articles }: PerspectiveWidgetProps) {
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);

  // Group and aggregate by origin
  const aggregates: Record<string, RegionAggregate> = {};

  articles.forEach((art) => {
    const origin = art.sourceOrigin || "Global";
    const sentiment = art.sentimentScore ?? 0;

    if (!aggregates[origin]) {
      aggregates[origin] = {
        origin,
        count: 0,
        avgSentiment: 0,
        sources: [],
      };
    }

    const agg = aggregates[origin];
    agg.count += 1;
    agg.avgSentiment += sentiment;

    if (!agg.sources.some((s) => s.name === art.source)) {
      agg.sources.push({
        name: art.source,
        type: art.sourceType,
        bias: art.biasGroup,
      });
    }
  });

  // Calculate averages
  const regionList = Object.values(aggregates).map((agg) => {
    agg.avgSentiment = agg.avgSentiment / agg.count;
    return agg;
  }).sort((a, b) => b.count - a.count);

  if (regionList.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/20 p-6 text-center text-muted-foreground text-xs italic">
        Geopolitical reporting details pending.
      </div>
    );
  }

  // Find perspective gap (delta between max and min sentiment)
  let maxRegion = regionList[0];
  let minRegion = regionList[0];
  regionList.forEach((r) => {
    if (r.avgSentiment > maxRegion.avgSentiment) maxRegion = r;
    if (r.avgSentiment < minRegion.avgSentiment) minRegion = r;
  });

  const delta = maxRegion.avgSentiment - minRegion.avgSentiment;
  const showDeltaAlert = regionList.length > 1 && delta >= 0.25;

  return (
    <div className="rounded-[2.5rem] border border-border bg-card/30 backdrop-blur-xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <span className="w-8 h-px bg-border" />
          Geopolitical Perspective Gap
        </h2>
        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/5 border-primary/20">
          {regionList.length} Reporting {regionList.length === 1 ? "Origin" : "Origins"}
        </Badge>
      </div>

      {/* Narrative Delta Alert Banner */}
      {showDeltaAlert && (
        <div className="bg-rose-500/5 rounded-2xl p-4 border border-rose-500/10 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <HugeiconsIcon icon={Alert01Icon} className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-500">
              Perspective Divergence Detected (Δ: {delta.toFixed(2)})
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Publishers based in <span className="font-bold text-foreground">{maxRegion.origin}</span> report with a positive bias (Avg: {maxRegion.avgSentiment.toFixed(2)}), whereas publishers based in <span className="font-bold text-rose-400">{minRegion.origin}</span> report with a negative bias (Avg: {minRegion.avgSentiment.toFixed(2)}).
            </p>
          </div>
        </div>
      )}

      {/* Horizontal Sentiment Spectrum Scale */}
      <div className="space-y-8 pt-2">
        <div className="relative h-2.5 w-full rounded-full bg-linear-to-r from-red-500/20 via-muted/40 to-emerald-500/20 border border-border/20">
          {/* Neutral Center Indicator */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-px bg-border/40" />

          {/* Plotting points */}
          {regionList.map((r) => {
            // map -1.0 to 1.0 to 0% to 100%
            const percentage = ((r.avgSentiment + 1) / 2) * 100;
            const bgClass = REGION_COLORS[r.origin] || "bg-gray-400";
            const isSelected = selectedOrigin === r.origin;

            return (
              <button
                key={r.origin}
                onClick={() => setSelectedOrigin(isSelected ? null : r.origin)}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group cursor-pointer focus:outline-none z-10"
                style={{ left: `${percentage}%` }}
                type="button"
              >
                <div
                  className={cn(
                    "h-5 w-5 rounded-full border-2 border-background transition-all duration-300 flex items-center justify-center hover:scale-125 shadow-lg",
                    bgClass,
                    isSelected ? "ring-2 ring-primary scale-125 border-primary" : "hover:ring-2 hover:ring-primary/40"
                  )}
                >
                  <span className="text-[7px] font-black text-white">{r.count}</span>
                </div>

                {/* Tooltip Label */}
                <div className="absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-background/90 border border-border/50 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-md pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                  {r.origin} ({r.avgSentiment.toFixed(2)})
                </div>
              </button>
            );
          })}
        </div>

        {/* Scale labels */}
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 px-1 pt-1 font-mono">
          <span>Critical / Hostile (-1.0)</span>
          <span>Balanced / Neutral (0.0)</span>
          <span>Favorable / Friendly (+1.0)</span>
        </div>
      </div>

      {/* Regional Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {regionList.map((r) => {
          const isSelected = selectedOrigin === r.origin;
          const bgClass = REGION_COLORS[r.origin] || "bg-gray-400";

          return (
            <div
              key={r.origin}
              onClick={() => setSelectedOrigin(isSelected ? null : r.origin)}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-4 cursor-pointer transition-all duration-300 bg-card/10",
                isSelected
                  ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/5"
                  : "border-border/40 hover:border-border/80"
              )}
            >
              {/* Regional Accent Bar */}
              <div className={cn("absolute top-0 left-0 h-full w-1", bgClass.split(" ")[0])} />

              <div className="pl-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {r.origin}
                    </span>
                    <Badge variant="outline" className="text-[8px] font-black py-0.5 px-1.5 uppercase font-mono">
                      {r.count} {r.count === 1 ? "report" : "reports"}
                    </Badge>
                  </div>
                  <span className={cn(
                    "text-xs font-mono font-bold px-1.5 py-0.5 rounded-md",
                    r.avgSentiment > 0.2 ? "text-emerald-500 bg-emerald-500/5 border border-emerald-500/10" :
                    r.avgSentiment < -0.2 ? "text-red-500 bg-red-500/5 border border-red-500/10" :
                    "text-blue-500 bg-blue-500/5 border border-blue-500/10"
                  )}>
                    Avg: {r.avgSentiment.toFixed(2)}
                  </span>
                </div>

                {/* Sources list */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {r.sources.map((s, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground/80 bg-muted/20 border border-border/30 rounded-md px-2 py-0.5"
                    >
                      <span>{s.name}</span>
                      {s.bias && (
                        <span className="text-[8px] font-black tracking-widest text-purple-400 uppercase">
                          {s.bias.replace("-leaning", "")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
