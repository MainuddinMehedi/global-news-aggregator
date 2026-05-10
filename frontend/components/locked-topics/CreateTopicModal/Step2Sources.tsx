"use client";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DatabaseIcon,
  GoogleIcon,
  Search01Icon,
  RedditIcon,
} from "@hugeicons/core-free-icons";

export default function Step2Sources({ data, setData, onNext, onPrev }: any) {
  const toggleSource = (type: string, label: string) => {
    const exists = data.sources.find((s: any) => s.type === type);
    if (exists) {
      setData({
        ...data,
        sources: data.sources.filter((s: any) => s.type !== type),
      });
    } else {
      setData({
        ...data,
        sources: [...data.sources, { id: type, type, label, enabled: true }],
      });
    }
  };

  const isSourceEnabled = (type: string) =>
    data.sources.some((s: any) => s.type === type);

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
