"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DatabaseIcon,
  GoogleIcon,
  Search01Icon,
  RedditIcon,
  Add01Icon,
  LinkSquare01Icon,
} from "@hugeicons/core-free-icons";
import { detectSourceType } from "@/lib/sourceDetection";
import { toast } from "sonner";

export default function Step2Sources({ data, setData, onNext, onPrev }: any) {
  const [customUrl, setCustomUrl] = useState("");

  const toggleSource = (type: string, label: string) => {
    const exists = data.sources.find((s: any) => s.type === type && !s.url);
    if (exists) {
      setData({
        ...data,
        sources: data.sources.filter((s: any) => s.type !== type || s.url),
      });
    } else {
      setData({
        ...data,
        sources: [...data.sources, { id: type, type, label, enabled: true }],
      });
    }
  };

  const removeCustomSource = (url: string) => {
    setData({
      ...data,
      sources: data.sources.filter((s: any) => s.url !== url),
    });
  };

  const handleAddCustomSource = () => {
    if (!customUrl) return;
    try {
      new URL(customUrl); // Simple validation
    } catch (_) {
      toast.error("Please enter a valid URL (including https://)");
      return;
    }

    const type = detectSourceType(customUrl);
    const exists = data.sources.find((s: any) => s.url === customUrl);

    if (!exists) {
      const label = new URL(customUrl).hostname.replace("www.", "");
      setData({
        ...data,
        sources: [
          ...data.sources,
          { id: customUrl, type, label, url: customUrl, enabled: true },
        ],
      });
      setCustomUrl("");
      toast.success(`Added as ${type.replace("_", " ")} source.`);
    } else {
      toast.info("Source already added.");
    }
  };

  const isSourceEnabled = (type: string) =>
    data.sources.some((s: any) => s.type === type && !s.url);

  const customSources = data.sources.filter((s: any) => s.url);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
          Tier 1 — System Native
        </h4>

        <div className="space-y-3">
          {/* Internal DB is always on */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-secondary bg-secondary/10 opacity-80">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={DatabaseIcon} size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">Internal Article DB</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                  Scans existing aggregate
                </p>
              </div>
            </div>
            <Switch checked disabled />
          </div>

          <SourceToggle
            label="Google News RSS"
            icon={GoogleIcon}
            enabled={isSourceEnabled("google_news")}
            onToggle={() => toggleSource("google_news", "Google News")}
          />
          <SourceToggle
            label="Brave Search API"
            icon={Search01Icon}
            enabled={isSourceEnabled("brave")}
            onToggle={() => toggleSource("brave", "Brave Search")}
          />
          <SourceToggle
            label="Reddit"
            icon={RedditIcon}
            enabled={isSourceEnabled("reddit")}
            onToggle={() => toggleSource("reddit", "Reddit")}
          />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-secondary/30">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
          Tier 3 — Custom Sources
        </h4>
        <div className="flex gap-2">
          <Input
            placeholder="Paste URL (RSS, YouTube, GitHub, Webpage...)"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="flex-1 bg-secondary/10 border-secondary rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && handleAddCustomSource()}
          />
          <Button
            onClick={handleAddCustomSource}
            variant="outline"
            className="rounded-xl border-secondary text-primary"
          >
            <HugeiconsIcon icon={Add01Icon} size={18} />
          </Button>
        </div>

        {customSources.length > 0 && (
          <div className="space-y-2 mt-4">
            {customSources.map((source: any) => (
              <div
                key={source.url}
                className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <HugeiconsIcon
                    icon={LinkSquare01Icon}
                    size={16}
                    className="text-primary flex-shrink-0"
                  />
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-bold truncate">
                      {source.url}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                      Type: {source.type.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCustomSource(source.url)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4">
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
          Analyze with AI
        </Button>
      </div>
    </div>
  );
}

function SourceToggle({ label, icon, enabled, onToggle }: any) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${enabled ? "border-primary/30 bg-primary/5" : "border-secondary bg-transparent hover:border-secondary-foreground/20"}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`p-2 rounded-lg transition-colors ${enabled ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
        >
          <HugeiconsIcon icon={icon} size={20} />
        </div>
        <p className="text-sm font-bold">{label}</p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
