"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreateTopicData } from "@/types/lockedTopic";
import { RefreshIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface Step1Props {
  data: CreateTopicData;
  setData: (data: CreateTopicData) => void;
  onNext: () => void;
}

export default function Step1Intent({ data, setData, onNext }: Step1Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState(
    !!(data.aiRefinedQuery && data.aiQuerySummary),
  );

  const isValid = data.displayName.trim() && data.userContext.trim();

  const handleAnalyze = useCallback(
    async (isRegenerate = false) => {
      if (!isValid) return;

      setAnalyzing(true);
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

        setAnalyzed(true);
        setAnalyzing(false);

        if (isRegenerate) {
          toast.success("Topic re-analyzed successfully.");
        }
      } catch (err) {
        setError("Failed to analyze topic. Please try again.");
        setAnalyzing(false);
      }
    },
    [data, isValid, setData],
  );

  if (analyzing) {
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
            type="button"
            onClick={() => handleAnalyze(true)}
            className="rounded-xl px-8"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="displayName"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70"
          >
            Display Name
          </Label>
          <Input
            id="displayName"
            placeholder="e.g. iran-israel, google-jobs"
            value={data.displayName}
            onChange={(e) => setData({ ...data, displayName: e.target.value })}
            className="rounded-xl border-secondary bg-secondary/30 focus-visible:ring-primary/20 h-12"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="userContext"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70"
          >
            What do you want to track?
          </Label>
          <Textarea
            id="userContext"
            placeholder="I want to track whether Google is posting any new AI or ML engineering roles, specifically in their DeepMind or Search divisions..."
            value={data.userContext}
            onChange={(e) => setData({ ...data, userContext: e.target.value })}
            className="min-h-[160px] rounded-xl border-secondary bg-secondary/30 focus-visible:ring-primary/20 resize-none leading-relaxed p-4 scrollbar-sleek"
          />
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            Describe your intent in detail. Our AI will analyze this to generate
            optimized search queries and identify relevant sources.
          </p>
        </div>
      </div>

      {!analyzed && (
        <Button
          type="button"
          disabled={!isValid}
          onClick={() => handleAnalyze()}
          className="w-full rounded-xl py-7 font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
        >
          <HugeiconsIcon icon={SparklesIcon} size={20} className="mr-2" />
          Analyze with AI
        </Button>
      )}

      {analyzed && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-4 p-5 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <HugeiconsIcon icon={SparklesIcon} size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  AI Intelligence Report
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAnalyze(true)}
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
                          <span className="ml-1 text-muted-foreground/50">
                            +
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            type="button"
            onClick={onNext}
            className="w-full rounded-xl py-7 font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
          >
            Continue to Sources
          </Button>
        </div>
      )}
    </div>
  );
}
