"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  RefreshIcon,
  InformationCircleIcon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { detectSourceType } from "@/lib/sourceDetection";
import { toast } from "sonner";
import { CreateTopicData } from "@/types/lockedTopic";

interface Step3Props {
  data: CreateTopicData;
  setData: (data: CreateTopicData) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step3AIReview({
  data,
  setData,
  onNext,
  onPrev,
}: Step3Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleRefine = useCallback(
    async (isRegenerate = false) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/locked-topics/ai-refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: data.displayName,
            userContext: data.userContext,
          }),
        });

        if (!res.ok) throw new Error("Analysis failed");

        const result = await res.json();
        setData({
          ...data,
          aiRefinedQuery: result.aiRefinedQuery,
          aiQuerySummary: result.aiQuerySummary,
          conceptualKeywords: result.conceptualKeywords,
          suggestedSources: result.suggestedSources,
        });
        setLoading(false);
        if (isRegenerate) {
          toast.success("Topic re-analyzed successfully.");
        }
      } catch (err) {
        setError("Failed to analyze topic. Please try again.");
        setLoading(false);
      }
    },
    [data.displayName, data.userContext, data.sources, setData],
  );

  useEffect(() => {
    if (data.aiRefinedQuery || data.aiQuerySummary) {
      setLoading(false);
      return;
    }

    handleRefine();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8 text-center animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-primary">
            <HugeiconsIcon
              icon={SparklesIcon}
              size={28}
              className="animate-pulse"
            />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black tracking-tight">
            Analyzing Intent...
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Generating optimized search queries and identifying high-signal
            sources for your tracker.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center space-y-6">
        <p className="text-destructive font-bold text-lg">{error}</p>
        <div className="flex justify-center gap-4">
          <Button
            onClick={onPrev}
            variant="outline"
            className="rounded-xl px-8"
          >
            Go Back
          </Button>
          <Button
            onClick={() => handleRefine(true)}
            className="rounded-xl px-8"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        <div className="space-y-4 p-5 rounded-2xl bg-primary/5 border border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <HugeiconsIcon icon={SparklesIcon} size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                AI Intelligence Report
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRefine(true)}
              className="h-7 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 gap-1.5 rounded-lg"
            >
              <HugeiconsIcon icon={RefreshIcon} size={12} />
              Regenerate
            </Button>
          </div>
          <p className="text-sm leading-relaxed font-medium italic text-foreground/90">
            &quot;{data.aiQuerySummary}&quot;
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Optimized Search Strategy
          </label>
          <Input
            value={data.aiRefinedQuery}
            onChange={(e) =>
              setData({ ...data, aiRefinedQuery: e.target.value })
            }
            className="font-mono text-xs rounded-xl bg-secondary/30 border-secondary h-12 focus-visible:ring-primary/20"
          />
          <p className="text-[10px] text-muted-foreground italic">
            This query will be used to scan Google News, Brave, and Reddit.
          </p>
        </div>

        {data.conceptualKeywords && data.conceptualKeywords.length > 0 && (
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Semantic Concept Buckets
            </label>
            <div className="flex flex-wrap gap-2">
              {data.conceptualKeywords.map((group, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 flex flex-wrap gap-1 items-center"
                >
                  {group.map((term, j) => (
                    <span
                      key={j}
                      className="text-[10px] font-bold text-primary"
                    >
                      {term}
                      {j < group.length - 1 && (
                        <span className="ml-1 text-muted-foreground/50">+</span>
                      )}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Matches ANY bucket (terms inside a bucket must match together).
            </p>
          </div>
        )}

        {data.suggestedSources?.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                High-Signal Recommendations
              </label>
              <div className="flex items-center gap-1 text-[9px] font-bold text-amber-500/80 uppercase tracking-tighter bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">
                <HugeiconsIcon icon={InformationCircleIcon} size={10} />
                Verify URLs before adding
              </div>
            </div>
            <div className="space-y-2">
              {(data.suggestedSources as any).map(
                (source: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-xl border border-secondary bg-secondary/10 group hover:border-primary/30 transition-colors"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">
                          {source.label}
                        </span>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Open URL to verify"
                        >
                          <HugeiconsIcon icon={ArrowUpRight01Icon} size={12} />
                        </a>
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate italic">
                        {source.url}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const type =
                          source.type || detectSourceType(source.url);
                        const exists = data.sources.find(
                          (s) => s.url === source.url,
                        );

                        if (!exists) {
                          setData({
                            ...data,
                            sources: [
                              ...data.sources,
                              {
                                id: source.url,
                                type,
                                label: source.label,
                                url: source.url,
                                enabled: true,
                              },
                            ],
                            suggestedSources: (
                              data.suggestedSources as any
                            ).filter((s: any) => s.url !== source.url),
                          });

                          toast.success(`Added ${source.label} to sources.`);
                        } else {
                          toast.info("Source already added.");
                        }
                      }}
                      className="h-8 px-4 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"
                    >
                      Add
                    </Button>
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-2">
        <Button
          variant="outline"
          onClick={onPrev}
          className="flex-1 rounded-xl py-7 border-secondary hover:bg-secondary/20"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-2 rounded-xl py-7 font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
        >
          Review & Confirm
        </Button>
      </div>
    </div>
  );
}
