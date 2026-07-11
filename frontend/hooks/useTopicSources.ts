import { getGithubUrlError } from "@/lib/locked-topics/sources/github";
import { getYoutubeUrlError } from "@/lib/locked-topics/sources/youtube";
import { CreateTopicData, SourceConfig } from "@/types/lockedTopic";
import { useState } from "react";
import { toast } from "sonner";

export function useTopicSources(
  data: CreateTopicData,
  setData: (data: CreateTopicData) => void,
) {
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

  return {
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
  };
}
