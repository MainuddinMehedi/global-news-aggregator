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
  Github01Icon,
  YoutubeIcon,
  Add01Icon,
  LinkSquare01Icon,
  ArrowUpRight01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { detectSourceType, generateSourceLabel } from "@/lib/sourceDetection";
import { toast } from "sonner";
import { CreateTopicData, SourceConfig } from "@/types/lockedTopic";

interface Step2Props {
  data: CreateTopicData;
  setData: (data: CreateTopicData) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step2Sources({
  data,
  setData,
  onNext,
  onPrev,
}: Step2Props) {
  const [customUrl, setCustomUrl] = useState("");

  const existingGithub = data.sources.find((s) => s.type === "github");
  const [githubUrl, setGithubUrl] = useState(existingGithub?.url || "");
  const [githubUrlError, setGithubUrlError] = useState("");

  const isGithubEnabled = data.sources.some(
    (s) => s.type === "github",
  );

  const existingYoutube = data.sources.find((s) => s.type === "youtube");
  const [youtubeUrl, setYoutubeUrl] = useState(existingYoutube?.url || "");
  const [youtubeUrlError, setYoutubeUrlError] = useState("");

  const isYoutubeEnabled = data.sources.some(
    (s) => s.type === "youtube",
  );

  function getGithubUrlError(url: string): string | null {
    if (!url) return null;
    try { new URL(url); } catch { return "Enter a valid URL."; }

    if (detectSourceType(url) === "rss") return "This looks like a feed URL. Paste it in the custom sources input below.";
    if (detectSourceType(url) !== "github") return "Enter a GitHub repo URL like https://github.com/owner/repo";

    const path = new URL(url).pathname.replace(/\/$/, "").split("/").filter(Boolean);
    if (path.length < 2) return "Enter a full repo URL like https://github.com/owner/repo";
    if (path.length > 2) return "Enter a repo URL without extra path segments.";

    return null;
  }

  function getYoutubeUrlError(input: string): string | null {
    if (!input) return null;
    const parts = input.split(",").map((p) => p.trim()).filter(Boolean);

    for (const part of parts) {
      try {
        new URL(part);
        if (detectSourceType(part) !== "youtube") {
          return `"${part}" is not a valid YouTube URL.`;
        }
      } catch {
        // Not a URL, so it's a name. Names are allowed.
      }
    }
    return null;
  }


  const toggleGithub = (enabled: boolean) => {
    setGithubUrlError("");
    if (enabled) {
      setData({
        ...data,
        sources: [
          ...data.sources,
          {
            id: "github",
            type: "github",
            label: "GitHub",
            enabled: true,
            url: githubUrl || undefined,
          },
        ],
      });
    } else {
      setData({
        ...data,
        sources: data.sources.filter((s) => s.type !== "github"),
      });
    }
  };

  const updateGithubUrl = (url: string) => {
    setGithubUrl(url);
    setGithubUrlError(getGithubUrlError(url) || "");
    if (isGithubEnabled) {
      setData({
        ...data,
        sources: data.sources.map((s) =>
          s.type === "github" ? { ...s, url: url || undefined } : s,
        ),
      });
    }
  };

  const toggleYoutube = (enabled: boolean) => {
    setYoutubeUrlError("");
    if (enabled) {
      setData({
        ...data,
        sources: [
          ...data.sources,
          {
            id: "youtube",
            type: "youtube",
            label: "YouTube",
            enabled: true,
            url: youtubeUrl || undefined,
          },
        ],
      });
    } else {
      setData({
        ...data,
        sources: data.sources.filter((s) => s.type !== "youtube"),
      });
    }
  };

  const updateYoutubeUrl = (url: string) => {
    setYoutubeUrl(url);
    setYoutubeUrlError(getYoutubeUrlError(url) || "");
    if (isYoutubeEnabled) {
      setData({
        ...data,
        sources: data.sources.map((s) =>
          s.type === "youtube" ? { ...s, url: url || undefined } : s,
        ),
      });
    }
  };

  const toggleSource = (type: SourceConfig["type"], label: string) => {
    const exists = data.sources.find((s) => s.type === type && !s.url);
    if (exists) {
      setData({
        ...data,
        sources: data.sources.filter((s) => s.type !== type || s.url),
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
      sources: data.sources.filter((s) => s.url !== url),
    });
  };

  const handleAddCustomSource = () => {
    if (!customUrl) return;
    try {
      new URL(customUrl);
    } catch {
      toast.error("Please enter a valid URL (including https://)");
      return;
    }

    const type = detectSourceType(customUrl);
    const exists = data.sources.find((s) => s.url === customUrl);

    if (!exists) {
      const label = generateSourceLabel(customUrl, type);
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

  const isSourceEnabled = (type: SourceConfig["type"]) =>
    data.sources.some((s) => s.type === type && !s.url);

  const customSources = data.sources.filter((s) => s.url);
  const suggestedSources = (data.suggestedSources || []) as {
    type: string;
    label: string;
    url: string;
  }[];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
          Tier 1 — System Native
        </h4>

        <div className="space-y-3">
          <SourceToggle
            label="Internal Article DB"
            icon={DatabaseIcon}
            enabled={isSourceEnabled("internal_db")}
            onToggle={() =>
              toggleSource("internal_db", "Internal Article DB")
            }
          />
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
          <SourceToggle
            label="YouTube"
            icon={YoutubeIcon}
            enabled={isYoutubeEnabled}
            onToggle={() => toggleYoutube(!isYoutubeEnabled)}
          />
          {isYoutubeEnabled && (
            <div className="ml-4 p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
              <Input
                placeholder="Enter channel names or URLs (comma separated)"
                value={youtubeUrl}
                onChange={(e) => updateYoutubeUrl(e.target.value)}
                className="bg-secondary/10 border-secondary rounded-xl"
              />
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                Enter names like <span className="font-mono text-primary/80">Bloomberg, ColdFusion</span> or direct URLs to prioritize specific channels.{" "}
                The system will discover videos from these channels and others related to your topic.
              </p>
              {youtubeUrlError && (
                <p className="text-[10px] text-destructive/90 font-semibold">
                  {youtubeUrlError}
                </p>
              )}
            </div>
          )}
          <SourceToggle
            label="GitHub"
            icon={Github01Icon}
            enabled={isGithubEnabled}
            onToggle={() => toggleGithub(!isGithubEnabled)}
          />
          {isGithubEnabled && (
            <div className="ml-4 p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
              <Input
                placeholder="Paste GitHub repo URL (optional)"
                value={githubUrl}
                onChange={(e) => updateGithubUrl(e.target.value)}
                className="bg-secondary/10 border-secondary rounded-xl"
              />
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                Enter a URL like <span className="font-mono text-primary/80">https://github.com/facebook/react</span> to track that repo&apos;s releases and merged PRs.{" "}
                Leave blank to search GitHub broadly for repos and merged PRs matching your topic.
              </p>
              {githubUrlError && (
                <p className="text-[10px] text-destructive/90 font-semibold">
                  {githubUrlError}
                </p>
              )}
            </div>
          )}
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
          <div className="space-y-2">
            {customSources.map((source) => (
              <div
                key={source.url}
                className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <HugeiconsIcon
                    icon={LinkSquare01Icon}
                    size={16}
                    className="text-primary shrink-0"
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
                  onClick={() => source.url && removeCustomSource(source.url)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        {suggestedSources.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                AI-Suggested Sources
              </span>
              <div className="flex items-center gap-1 text-[9px] font-bold text-amber-500/80 uppercase tracking-tighter bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">
                <HugeiconsIcon icon={InformationCircleIcon} size={10} />
                Verify URLs before adding
              </div>
            </div>
            <div className="space-y-2">
              {suggestedSources.map((source, idx) => {
                const alreadyAdded = data.sources.some(
                  (s) => s.url === source.url,
                );
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-secondary bg-secondary/10 group hover:border-primary/30 transition-colors"
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
                          <HugeiconsIcon
                            icon={ArrowUpRight01Icon}
                            size={12}
                          />
                        </a>
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate italic">
                        {source.url}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={alreadyAdded}
                      onClick={() => {
                        const type =
                          source.type || detectSourceType(source.url);
                        setData({
                          ...data,
                          sources: [
                            ...data.sources,
                            {
                              id: source.url,
                              type: type as SourceConfig["type"],
                              label: source.label,
                              url: source.url,
                              enabled: true,
                            },
                          ],
                          suggestedSources: suggestedSources.filter(
                            (s) => s.url !== source.url,
                          ),
                        });
                        toast.success(`Added ${source.label} to sources.`);
                      }}
                      className="h-8 px-4 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"
                    >
                      {alreadyAdded ? "Added" : "Add"}
                    </Button>
                  </div>
                );
              })}
            </div>
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
          Review & Launch
        </Button>
      </div>
    </div>
  );
}

interface SourceToggleProps {
  label: string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  icon: any;
  enabled: boolean;
  onToggle: () => void;
}

function SourceToggle({ label, icon, enabled, onToggle }: SourceToggleProps) {
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
