"use client";

import { useState } from "react";
import { SkippedArticleData, GazetteerConfig } from "@/queries/admin/skipped";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon, CodeIcon, Add01Icon, CleanIcon } from "@hugeicons/core-free-icons";

interface GazetteerSandboxProps {
  selectedArticle?: SkippedArticleData;
  gazetteerConfig: GazetteerConfig;
}

interface StagedRule {
  id: string;
  targetType: "category" | "region";
  targetName: string;
  ruleType: "term" | "exclusion";
  value: string;
  weight?: number;
}

interface GazetteerRawConfig {
  categories: Record<string, { terms: Record<string, number>; exclusions: string[] }>;
  regions: Record<string, { terms: Record<string, number>; exclusions: string[] }>;
}

export default function GazetteerSandbox({
  selectedArticle,
  gazetteerConfig,
}: GazetteerSandboxProps) {
  // Form states
  const [targetType, setTargetType] = useState<"category" | "region">("category");
  const [targetName, setTargetName] = useState<string>(() => gazetteerConfig.categories[0] || "");
  const [ruleType, setRuleType] = useState<"term" | "exclusion">("term");
  const [value, setValue] = useState<string>("");
  const [weight, setWeight] = useState<number>(2);

  // Client-side modified config state to accumulate staged rules
  const [modifiedConfig, setModifiedConfig] = useState<GazetteerRawConfig>(() => {
    return JSON.parse(JSON.stringify(gazetteerConfig.rawConfig)) as GazetteerRawConfig;
  });

  // Keep track of all changes staged in the current sandbox session
  const [stagedRules, setStagedRules] = useState<StagedRule[]>([]);

  // Clean value (lowercase, trimmed)
  const cleanValue = value.trim().toLowerCase();

  // Create simulated local JSON preview of the specific category/region
  const getPreviewJsonString = () => {
    if (!targetName) return "{}";
    
    const typeKey = targetType === "category" ? "categories" : "regions";
    const section = modifiedConfig[typeKey]?.[targetName] || { terms: {}, exclusions: [] };

    // If there is an active input value, simulate it on top of the section preview
    if (cleanValue) {
      const previewSection = JSON.parse(JSON.stringify(section));
      if (ruleType === "term") {
        if (!previewSection.terms) previewSection.terms = {};
        previewSection.terms = {
          ...previewSection.terms,
          [`👉 ${cleanValue} (NEW)`]: weight
        };
      } else {
        if (!previewSection.exclusions) previewSection.exclusions = [];
        if (!previewSection.exclusions.includes(cleanValue)) {
          previewSection.exclusions = [
            ...previewSection.exclusions,
            `👉 ${cleanValue} (NEW)`
          ];
        }
      }
      return JSON.stringify({ [targetName]: previewSection }, null, 2);
    }

    return JSON.stringify({ [targetName]: section }, null, 2);
  };

  // Stage the rule to the local client state
  const handleStageRule = () => {
    if (!cleanValue) {
      toast.error("Please enter a term or exclusion value.");
      return;
    }

    const typeKey = targetType === "category" ? "categories" : "regions";
    
    // Deep clone the current modifiedConfig
    const newConfig = JSON.parse(JSON.stringify(modifiedConfig));
    
    if (!newConfig[typeKey]) {
      newConfig[typeKey] = {};
    }
    if (!newConfig[typeKey][targetName]) {
      newConfig[typeKey][targetName] = { terms: {}, exclusions: [] };
    }

    const targetObj = newConfig[typeKey][targetName];

    if (ruleType === "term") {
      if (!targetObj.terms) targetObj.terms = {};
      targetObj.terms[cleanValue] = weight;
    } else {
      if (!targetObj.exclusions) targetObj.exclusions = [];
      if (!targetObj.exclusions.includes(cleanValue)) {
        targetObj.exclusions.push(cleanValue);
      }
    }

    setModifiedConfig(newConfig);
    setStagedRules((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        targetType,
        targetName,
        ruleType,
        value: cleanValue,
        weight: ruleType === "term" ? weight : undefined,
      }
    ]);

    setValue("");
    toast.success(`Staged '${cleanValue}' to preview config.`);
  };

  // Revert all changes and reset sandbox state
  const handleResetSandbox = () => {
    setModifiedConfig(JSON.parse(JSON.stringify(gazetteerConfig.rawConfig)));
    setStagedRules([]);
    setValue("");
    toast.info("Sandbox reset. Reverted all staged rules.");
  };

  // Compile full modified JSON and trigger download
  const handleDownloadFullJson = () => {
    const jsonString = JSON.stringify(modifiedConfig, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gazetteer.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("gazetteer.json downloaded successfully. Commit this in your git repository.");
  };

  return (
    <div className="flex flex-col 2xl:flex-row gap-6">
      {/* Left: Input Sandbox Controls */}
      <div className="flex-1 space-y-6">
        {/* Analyzed Article Card */}
        {selectedArticle ? (
          <div className="p-4 border border-border/50 bg-muted/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                Analyzing Article Context
              </span>
              <button
                onClick={() => setValue(selectedArticle.rawArticle.title)}
                className="text-[10px] text-muted-foreground hover:text-foreground font-semibold underline cursor-pointer"
              >
                Copy Title to Input
              </button>
            </div>
            <h4 className="text-xs font-bold text-foreground">
              {selectedArticle.rawArticle.title}
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {selectedArticle.rawArticle.contentSnippet}
            </p>
            <div className="text-[10px] text-muted-foreground italic bg-muted/40 p-2 rounded-lg border border-border/30">
              💡 Tip: Highlight and copy (Ctrl+C) any word or key phrase from the title or snippet above, and paste it in the Rule Value box below.
            </div>
          </div>
        ) : (
          <div className="p-5 border border-dashed border-border/60 bg-muted/5 rounded-2xl text-center text-muted-foreground">
            <p className="text-xs font-medium">
              No article selected for context. Select &quot;Analyze&quot; on any skipped article to view its details here.
            </p>
          </div>
        )}

        {/* Dictionary Rule Form */}
        <div className="bg-card/45 backdrop-blur-md border border-border/50 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground">Build Sandbox Rule</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground">Dictionary Type</label>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setTargetType("category");
                    setTargetName(gazetteerConfig.categories[0] || "");
                  }}
                  variant={targetType === "category" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs font-bold h-9 cursor-pointer"
                >
                  Category
                </Button>
                <Button
                  onClick={() => {
                    setTargetType("region");
                    setTargetName(gazetteerConfig.regions[0] || "");
                  }}
                  variant={targetType === "region" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs font-bold h-9 cursor-pointer"
                >
                  Region
                </Button>
              </div>
            </div>

            {/* Target Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground">Select Name</label>
              <select
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className="w-full text-xs bg-muted/50 border border-border rounded-lg p-2 h-9 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                {targetType === "category"
                  ? gazetteerConfig.categories.map((c) => (
                      <option key={c} value={c}>
                        {c.toUpperCase()}
                      </option>
                    ))
                  : gazetteerConfig.regions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rule Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground">Rule Type</label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setRuleType("term")}
                  variant={ruleType === "term" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs font-bold h-9 cursor-pointer"
                >
                  Inclusion Term
                </Button>
                <Button
                  onClick={() => setRuleType("exclusion")}
                  variant={ruleType === "exclusion" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs font-bold h-9 cursor-pointer"
                >
                  Exclusion
                </Button>
              </div>
            </div>

            {/* Weight (Only for term) */}
            {ruleType === "term" ? (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-foreground">Inclusion Weight</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((w) => (
                    <Button
                      key={w}
                      onClick={() => setWeight(w)}
                      variant={weight === w ? "default" : "outline"}
                      size="sm"
                      className="flex-1 text-xs font-bold h-9 cursor-pointer"
                    >
                      {w} {w === 1 ? "(Low)" : w === 2 ? "(Mid)" : "(High)"}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-end text-[11px] text-muted-foreground p-2 bg-muted/20 border border-border/40 rounded-lg">
                ⚠️ Exclusions instantly set matching article scores to 0 for this category or region.
              </div>
            )}
          </div>

          {/* Rule Value */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground">Rule Keyword/Phrase</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. initial public offering, sportswashing..."
              className="w-full text-xs bg-muted/50 border border-border rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-muted-foreground/60"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleStageRule}
              disabled={!cleanValue}
              className="flex-1 text-xs font-bold bg-primary hover:bg-primary/95 text-primary-foreground gap-2 h-10 shadow-sm cursor-pointer"
            >
              <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
              Stage Rule to Preview
            </Button>
            
            <Button
              onClick={handleDownloadFullJson}
              disabled={stagedRules.length === 0}
              variant="outline"
              className="flex-1 text-xs font-bold gap-2 h-10 border-primary/30 text-primary hover:border-primary/50 cursor-pointer"
            >
              <HugeiconsIcon icon={Download01Icon} className="w-4 h-4" />
              Download Modified JSON
            </Button>
          </div>

          {/* Staged Changes Log List */}
          {stagedRules.length > 0 && (
            <div className="mt-4 p-4 bg-muted/20 border border-border/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wide">
                  Staged Changes ({stagedRules.length})
                </span>
                <button
                  onClick={handleResetSandbox}
                  className="text-[10px] text-red-500 hover:underline font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none"
                >
                  <HugeiconsIcon icon={CleanIcon} className="w-3 h-3" />
                  Reset Reverts
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto p-1">
                {stagedRules.map((rule) => (
                  <span
                    key={rule.id}
                    className="text-[10px] font-bold px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-primary flex items-center"
                  >
                    {rule.targetName}: {rule.ruleType === "term" ? `+${rule.value} (w:${rule.weight})` : `-${rule.value}`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Live Preview */}
      <div className="w-full 2xl:w-[380px] shrink-0 bg-card/45 backdrop-blur-md border border-border/50 rounded-2xl p-5 flex flex-col h-[380px] 2xl:h-[480px]">
        <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-3">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <HugeiconsIcon icon={CodeIcon} className="w-3.5 h-3.5 text-primary" />
            Live Dictionary Preview
          </h3>
          <span className="text-[9px] font-bold text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
            {targetType.toUpperCase()}
          </span>
        </div>

        <p className="text-[10px] text-muted-foreground mb-3 leading-normal">
          Simulated view of the changes that will be saved to your local <code className="text-foreground font-semibold">gazetteer.json</code> file.
        </p>

        <div className="flex-1 bg-black/95 rounded-xl border border-border/80 overflow-auto p-4.5 font-mono text-[10px] leading-relaxed text-green-400">
          <pre>{getPreviewJsonString()}</pre>
        </div>
      </div>
    </div>
  );
}
