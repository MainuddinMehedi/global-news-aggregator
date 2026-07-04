"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { detectSourceType } from "@/lib/sourceDetection";
import { CreateTopicData, SourceConfig } from "@/types/lockedTopic";
import {
  DatabaseIcon,
  Github01Icon,
  GoogleIcon,
  RedditIcon,
  Search01Icon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";
import CustomSourceInput from "./CustomSourceInput";
import SuggestedSourcesList from "./SuggestedSourcesList";

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
  const customSources = data.sources.filter((s) => s.url);
  const suggestedSources = (data.suggestedSources || []) as {
    type: string;
    label: string;
    url: string;
  }[];

  const existingGithub = data.sources.find((s) => s.type === "github");
  const [githubUrl, setGithubUrl] = useState(existingGithub?.url || "");
  const [githubUrlError, setGithubUrlError] = useState("");

  const isGithubEnabled = data.sources.some((s) => s.type === "github");

  const existingYoutube = data.sources.find((s) => s.type === "youtube");
  const [youtubeUrl, setYoutubeUrl] = useState(existingYoutube?.url || "");
  const [youtubeUrlError, setYoutubeUrlError] = useState("");

  const isYoutubeEnabled = data.sources.some((s) => s.type === "youtube");

  function getGithubUrlError(url: string): string | null {
    if (!url) return null;
    try {
      new URL(url);
    } catch {
      return "Enter a valid URL.";
    }

    if (detectSourceType(url) === "rss")
      return "This looks like a feed URL. Paste it in the custom sources input below.";
    if (detectSourceType(url) !== "github")
      return "Enter a GitHub repo URL like https://github.com/owner/repo";

    const path = new URL(url).pathname
      .replace(/\/$/, "")
      .split("/")
      .filter(Boolean);
    if (path.length < 2)
      return "Enter a full repo URL like https://github.com/owner/repo";
    if (path.length > 2) return "Enter a repo URL without extra path segments.";

    return null;
  }

  function getYoutubeUrlError(input: string): string | null {
    if (!input) return null;
    const parts = input
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

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

  const isSourceEnabled = (type: SourceConfig["type"]) =>
    data.sources.some((s) => s.type === type && !s.url);

  const handleAddCustomSource = (source: {
    url: string;
    type: SourceConfig["type"];
    label: string;
  }) => {
    const exists = data.sources.find((s) => s.url === source.url);

    if (!exists) {
      let siteRestriction;
      if (source.type === "search") {
        try {
          siteRestriction = new URL(source.url).hostname.replace("www.", "");
        } catch {}
      }

      setData({
        ...data,
        sources: [
          ...data.sources,
          {
            id: source.url,
            type: source.type,
            label: source.label,
            url: source.url,
            ...(siteRestriction ? { siteRestriction } : {}),
            enabled: true,
            preChecked: true,
          },
        ],
      });
      toast.success(`Added as ${source.type.replace("_", " ")} source.`);
    } else {
      toast.info("Source already added.");
    }
  };

  const handleAddSuggestedSource = (source: {
    url: string;
    type: SourceConfig["type"];
    label: string;
  }) => {
    setData({
      ...data,
      sources: [
        ...data.sources,
        {
          id: source.url,
          type: source.type,
          label: source.label,
          url: source.url,
          enabled: true,
          preChecked: true,
        },
      ],
      suggestedSources: suggestedSources.filter((s) => s.url !== source.url),
    });
    toast.success(`Added ${source.label} to sources.`);
  };

  const handleRemoveSource = (url: string) => {
    setData({
      ...data,
      sources: data.sources.filter((s) => s.url !== url),
    });
  };

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
            onToggle={() => toggleSource("internal_db", "Internal Article DB")}
          />
          <SourceToggle
            label="Google News RSS"
            icon={GoogleIcon}
            enabled={isSourceEnabled("google_news")}
            onToggle={() => toggleSource("google_news", "Google News")}
          />
          <SourceToggle
            label="Internet Search"
            icon={Search01Icon}
            enabled={isSourceEnabled("search")}
            onToggle={() => toggleSource("search", "Internet Search")}
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
                Enter names like{" "}
                <span className="font-mono text-primary/80">
                  Bloomberg, ColdFusion
                </span>{" "}
                or direct URLs to prioritize specific channels. The system will
                discover videos from these channels and others related to your
                topic.
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
                Enter a URL like{" "}
                <span className="font-mono text-primary/80">
                  https://github.com/facebook/react
                </span>{" "}
                to track that repo&apos;s releases and merged PRs. Leave blank
                to search GitHub broadly for repos and merged PRs matching your
                topic.
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

      <CustomSourceInput
        onAddSource={handleAddCustomSource}
        customSources={customSources}
        onRemoveSource={handleRemoveSource}
      />

      <SuggestedSourcesList
        suggestedSources={suggestedSources}
        sources={data.sources}
        onAddSource={handleAddSuggestedSource}
      />

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          className="flex-1 rounded-xl py-7 border-secondary hover:bg-secondary/20"
        >
          Back
        </Button>
        <Button
          type="button"
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
