"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTopicSources } from "@/hooks/useTopicSources";
import { CreateTopicData } from "@/types/lockedTopic";
import {
  DatabaseIcon,
  Github01Icon,
  GoogleIcon,
  RedditIcon,
  Search01Icon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons";
import CustomSourceInput from "./CustomSourceInput";
import { SourceToggle } from "./SourceToggle";
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
  const {
    customSources,
    suggestedSources,
    isGithubEnabled,
    githubUrl,
    githubUrlError,
    toggleGithub,
    updateGithubUrl,
    isYoutubeEnabled,
    youtubeUrl,
    youtubeUrlError,
    toggleYoutube,
    updateYoutubeUrl,
    toggleSource,
    isSourceEnabled,
    handleAddCustomSource,
    handleAddSuggestedSource,
    handleRemoveSource,
  } = useTopicSources(data, setData);

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
