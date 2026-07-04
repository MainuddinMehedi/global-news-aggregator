"use client";

import { Button } from "@/components/ui/button";
import { detectSourceType } from "@/lib/sourceDetection";
import { SourceConfig } from "@/types/lockedTopic";
import {
  ArrowUpRight01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";

interface SuggestedSourcesListProps {
  suggestedSources: {
    type: string;
    label: string;
    url: string;
  }[];
  sources: SourceConfig[];
  onAddSource: (source: {
    url: string;
    type: SourceConfig["type"];
    label: string;
  }) => void;
}

export default function SuggestedSourcesList({
  suggestedSources,
  sources,
  onAddSource,
}: SuggestedSourcesListProps) {
  const [suggestionStatuses, setSuggestionStatuses] = useState<
    Record<
      string,
      {
        isValidating: boolean;
        isValidated: boolean;
        error?: string;
      }
    >
  >({});

  const validatedRef = useRef(new Set<string>());

  useEffect(() => {
    if (suggestedSources.length === 0) return;

    // Filter out sources that:
    // 1. Are already in the validatedRef
    // 2. Are already added in data.sources
    const toValidate = suggestedSources.filter(
      (source) =>
        source.url &&
        !validatedRef.current.has(source.url) &&
        !sources.some((s) => s.url === source.url),
    );

    if (toValidate.length === 0) return;

    // Mark as checked to prevent future re-validation loops immediately
    for (const source of toValidate) {
      validatedRef.current.add(source.url);
    }

    // Initialize checking state
    setSuggestionStatuses((prev) => {
      const next = { ...prev };
      for (const source of toValidate) {
        next[source.url] = { isValidating: true, isValidated: false };
      }
      return next;
    });

    const activeControllers = new Map<string, AbortController>();

    for (const source of toValidate) {
      const controller = new AbortController();
      activeControllers.set(source.url, controller);

      (async (url: string) => {
        try {
          const res = await fetch(
            `/api/locked-topics/check-source?url=${encodeURIComponent(url)}`,
            {
              signal: controller.signal,
            },
          );
          if (res.ok) {
            const json = await res.json();
            setSuggestionStatuses((prev) => ({
              ...prev,
              [url]: {
                isValidating: false,
                isValidated: json.valid,
                error: json.valid
                  ? undefined
                  : json.error || "Source is unreachable or invalid.",
              },
            }));
          } else {
            setSuggestionStatuses((prev) => ({
              ...prev,
              [url]: {
                isValidating: false,
                isValidated: false,
                error: "Could not connect to validation server.",
              },
            }));
          }
        } catch (err: any) {
          if (err.name === "AbortError") return;
          setSuggestionStatuses((prev) => ({
            ...prev,
            [url]: {
              isValidating: false,
              isValidated: false,
              error: err.message || "Connection failed.",
            },
          }));
        }
      })(source.url);
    }

    return () => {
      for (const controller of activeControllers.values()) {
        controller.abort();
      }
    };
  }, [suggestedSources, sources]);

  if (suggestedSources.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
          AI-Suggested Sources
        </span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500/80 uppercase tracking-tighter bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
            <HugeiconsIcon icon={InformationCircleIcon} size={10} />
            Auto-Validated by system
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold text-amber-500/80 uppercase tracking-tighter bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">
            <HugeiconsIcon icon={InformationCircleIcon} size={10} />
            Verify URLs before adding
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {suggestedSources.map((source, idx) => {
          const alreadyAdded = sources.some((s) => s.url === source.url);
          const status = suggestionStatuses[source.url];
          const isValidating = status?.isValidating;
          const isValidated = status?.isValidated;
          const validationError = status?.error;

          const isAddDisabled =
            alreadyAdded || isValidating || (status && !isValidated);
          let buttonText = "Add";
          if (alreadyAdded) {
            buttonText = "Added";
          } else if (isValidating) {
            buttonText = "Checking...";
          } else if (status && !isValidated) {
            buttonText = "Invalid";
          }

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
                    <HugeiconsIcon icon={ArrowUpRight01Icon} size={12} />
                  </a>
                </div>
                <span className="text-[10px] text-muted-foreground truncate italic">
                  {source.url}
                </span>
                {status && (
                  <div className="text-[9px] mt-0.5 font-medium transition-all duration-200">
                    {isValidating && (
                      <span className="text-muted-foreground animate-pulse">
                        🔍 Checking source...
                      </span>
                    )}
                    {validationError && (
                      <span className="text-destructive font-semibold">
                        ❌ {validationError}
                      </span>
                    )}
                    {isValidated && (
                      <span className="text-emerald-500 font-bold">
                        ✅ Validated source
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isAddDisabled}
                onClick={() => {
                  const type = (source.type ||
                    detectSourceType(source.url)) as SourceConfig["type"];
                  onAddSource({ url: source.url, type, label: source.label });
                }}
                className="h-8 px-4 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"
              >
                {buttonText}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
