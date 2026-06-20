"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sparkles, ArrowRightIcon } from "@hugeicons/core-free-icons";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { saveAiConfig, toggleAiPause } from "@/app/actions/admin";
import { AiConfigSettings, AiUsageDataPoint } from "@/queries/admin/ai";
import AiUsageCharts from "./AiUsageCharts";

interface AiEngineTabProps {
  initialSettings: AiConfigSettings;
  usageTimeline: AiUsageDataPoint[];
}

export default function AiEngineTab({ initialSettings, usageTimeline }: AiEngineTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Settings State
  const [pauseAI, setPauseAI] = useState(initialSettings.pauseAI);
  const [primaryModel, setPrimaryModel] = useState(initialSettings.primary.model);
  const [primaryTpm, setPrimaryTpm] = useState(initialSettings.primary.tpmLimit);
  const [primaryRpm, setPrimaryRpm] = useState(initialSettings.primary.rpmLimit);
  const [primaryConcurrency, setPrimaryConcurrency] = useState(initialSettings.primary.concurrencyLimit);
  const [primaryBatchSize, setPrimaryBatchSize] = useState(initialSettings.primary.batchSize);

  const [fallbackModel, setFallbackModel] = useState(initialSettings.fallback.model);
  const [fallbackTpm, setFallbackTpm] = useState(initialSettings.fallback.tpmLimit);
  const [fallbackRpm, setFallbackRpm] = useState(initialSettings.fallback.rpmLimit);
  const [fallbackConcurrency, setFallbackConcurrency] = useState(initialSettings.fallback.concurrencyLimit);
  const [fallbackBatchSize, setFallbackBatchSize] = useState(initialSettings.fallback.batchSize);

  // Toggle Pause AI Ingestion
  const handleTogglePause = (checked: boolean) => {
    setPauseAI(checked);
    startTransition(async () => {
      const res = await toggleAiPause(checked);
      if (res.success) {
        toast.success(checked ? "AI Ingestion globally paused." : "AI Ingestion globally resumed.");
        router.refresh();
      } else {
        toast.error(`Failed to change pause state: ${res.error}`);
        setPauseAI(!checked); // Revert state
      }
    });
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveAiConfig({
        primary: {
          model: primaryModel,
          tpmLimit: Number(primaryTpm),
          rpmLimit: Number(primaryRpm),
          concurrencyLimit: Number(primaryConcurrency),
          batchSize: Number(primaryBatchSize),
        },
        fallback: {
          model: fallbackModel,
          tpmLimit: Number(fallbackTpm),
          rpmLimit: Number(fallbackRpm),
          concurrencyLimit: Number(fallbackConcurrency),
          batchSize: Number(fallbackBatchSize),
        },
      });

      if (res.success) {
        toast.success("AI configurations saved successfully.");
        router.refresh();
      } else {
        toast.error(`Failed to save configurations: ${res.error}`);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Global Ingestion Pause Control Banner */}
      <div
        className={`border rounded-2xl p-6 transition-all duration-500 shadow-sm relative overflow-hidden ${
          pauseAI
            ? "bg-amber-500/10 border-amber-500/30 shadow-amber-500/5"
            : "bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/5"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${pauseAI ? "bg-amber-500" : "bg-emerald-500"}`} />
              <h3 className="font-bold text-foreground">
                AI Pipeline Status: {pauseAI ? "PAUSED (Stage 1 Only)" : "ACTIVE (Stage 1 + Stage 2)"}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              {pauseAI
                ? "Stage 2 LLM/ML processing is disabled globally. Ingested articles bypass Groq/Mistral entirely to save token expenses, and are stored with Stage 1 category mappings directly."
                : "Standard 2-stage enrichment is active. Gazetteers categorize articles, and valid geopolitical items are enriched via generative models for entities, sentiment, and narrative bias."}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Label htmlFor="pause-ai-switch" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pause AI Ingestion
            </Label>
            <Switch
              id="pause-ai-switch"
              checked={pauseAI}
              onCheckedChange={handleTogglePause}
              disabled={isPending}
            />
          </div>
        </div>
        {/* Subtle background glow effect */}
        <div
          className={`absolute -right-16 -top-16 w-36 h-36 rounded-full blur-3xl opacity-20 transition-all duration-500 ${
            pauseAI ? "bg-amber-500" : "bg-emerald-500"
          }`}
        />
      </div>

      {/* Configuration Forms */}
      <form onSubmit={handleSaveSettings} className="bg-card/45 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-border/60 pb-4">
          <HugeiconsIcon icon={Sparkles} className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">Generative Model Override Configurations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Primary Model (Mistral) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">Primary Provider (Mistral)</h3>
              <span className="text-[10px] bg-purple-500/10 text-purple-400 font-bold px-2 py-0.5 rounded-full">Primary</span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Model Identifier</Label>
                <Input
                  value={primaryModel}
                  onChange={(e) => setPrimaryModel(e.target.value)}
                  placeholder="e.g. mistral-small-2506"
                  required
                  disabled={isPending}
                  className="bg-muted/30 border-border/60 font-mono text-sm focus:border-purple-400 focus:ring-purple-400/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">Batch Size</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={primaryBatchSize}
                    onChange={(e) => setPrimaryBatchSize(Number(e.target.value))}
                    required
                    disabled={isPending}
                    className="bg-muted/30 border-border/60 text-sm focus:border-purple-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">Concurrency Limit</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={primaryConcurrency}
                    onChange={(e) => setPrimaryConcurrency(Number(e.target.value))}
                    required
                    disabled={isPending}
                    className="bg-muted/30 border-border/60 text-sm focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">RPM Limit</Label>
                  <Input
                    type="number"
                    min="1"
                    value={primaryRpm}
                    onChange={(e) => setPrimaryRpm(Number(e.target.value))}
                    required
                    disabled={isPending}
                    className="bg-muted/30 border-border/60 text-sm focus:border-purple-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">TPM Limit</Label>
                  <Input
                    type="number"
                    min="1"
                    value={primaryTpm}
                    onChange={(e) => setPrimaryTpm(Number(e.target.value))}
                    required
                    disabled={isPending}
                    className="bg-muted/30 border-border/60 text-sm focus:border-purple-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fallback Model (Groq) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">Fallback Provider (Groq)</h3>
              <span className="text-[10px] bg-sky-500/10 text-sky-400 font-bold px-2 py-0.5 rounded-full">Backup</span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Model Identifier</Label>
                <Input
                  value={fallbackModel}
                  onChange={(e) => setFallbackModel(e.target.value)}
                  placeholder="e.g. meta-llama/llama-3.1-70b-instruct"
                  required
                  disabled={isPending}
                  className="bg-muted/30 border-border/60 font-mono text-sm focus:border-sky-400 focus:ring-sky-400/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">Batch Size</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={fallbackBatchSize}
                    onChange={(e) => setFallbackBatchSize(Number(e.target.value))}
                    required
                    disabled={isPending}
                    className="bg-muted/30 border-border/60 text-sm focus:border-sky-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">Concurrency Limit</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={fallbackConcurrency}
                    onChange={(e) => setFallbackConcurrency(Number(e.target.value))}
                    required
                    disabled={isPending}
                    className="bg-muted/30 border-border/60 text-sm focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">RPM Limit</Label>
                  <Input
                    type="number"
                    min="1"
                    value={fallbackRpm}
                    onChange={(e) => setFallbackRpm(Number(e.target.value))}
                    required
                    disabled={isPending}
                    className="bg-muted/30 border-border/60 text-sm focus:border-sky-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">TPM Limit</Label>
                  <Input
                    type="number"
                    min="1"
                    value={fallbackTpm}
                    onChange={(e) => setFallbackTpm(Number(e.target.value))}
                    required
                    disabled={isPending}
                    className="bg-muted/30 border-border/60 text-sm focus:border-sky-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border/60">
          <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 rounded-xl flex items-center gap-2">
            {isPending ? (
              <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <HugeiconsIcon icon={ArrowRightIcon} className="w-4 h-4" />
            )}
            Save Configuration Settings
          </Button>
        </div>
      </form>

      {/* Analytics Telemetry Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <h3 className="text-base font-bold text-foreground">AI Token Utilization & Telemetry</h3>
        </div>
        <AiUsageCharts usageTimeline={usageTimeline} />
      </div>
    </div>
  );
}
