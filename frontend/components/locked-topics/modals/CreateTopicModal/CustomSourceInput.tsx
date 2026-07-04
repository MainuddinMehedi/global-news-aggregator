"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { detectSourceType, generateSourceLabel } from "@/lib/sourceDetection";
import { SourceConfig } from "@/types/lockedTopic";
import { Add01Icon, LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CustomSourceInputProps {
  onAddSource: (source: {
    url: string;
    type: SourceConfig["type"];
    label: string;
  }) => void;
  customSources: SourceConfig[];
  onRemoveSource: (url: string) => void;
}

export default function CustomSourceInput({
  onAddSource,
  customSources,
  onRemoveSource,
}: CustomSourceInputProps) {
  const [customUrl, setCustomUrl] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [detectedType, setDetectedType] = useState<SourceConfig["type"] | "">(
    "",
  );

  useEffect(() => {
    if (!customUrl.trim()) {
      setIsValidating(false);
      setIsValidated(false);
      setValidationError("");
      setDetectedType("");
      return;
    }

    try {
      new URL(customUrl);
    } catch {
      setIsValidating(false);
      setIsValidated(false);
      setValidationError(
        "Invalid URL format. Make sure to include http:// or https://",
      );
      setDetectedType("");
      return;
    }

    setIsValidating(true);
    setIsValidated(false);
    setValidationError("");
    setDetectedType("");

    const controller = new AbortController();

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/locked-topics/check-source?url=${encodeURIComponent(customUrl)}`,
          {
            signal: controller.signal,
          },
        );
        if (res.ok) {
          const json = await res.json();
          if (json.valid) {
            setIsValidated(true);
            setDetectedType(json.type);
          } else {
            setValidationError(json.error || "Source validation failed.");
          }
        } else {
          setValidationError("Could not connect to validation server.");
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setValidationError("Could not connect to validation server.");
      } finally {
        setIsValidating(false);
      }
    }, 600);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [customUrl]);

  const handleAdd = () => {
    if (!customUrl) return;
    if (isValidating) {
      toast.error("Please wait for source validation to complete.");
      return;
    }
    if (validationError) {
      toast.error(`Cannot add source: ${validationError}`);
      return;
    }
    if (!isValidated) {
      toast.error("Please enter a valid, reachable URL.");
      return;
    }

    const type = (detectedType ||
      detectSourceType(customUrl)) as SourceConfig["type"];
    const label = generateSourceLabel(customUrl, type);

    onAddSource({ url: customUrl, type, label });
    setCustomUrl("");
  };

  return (
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
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button
          type="button"
          onClick={handleAdd}
          variant="outline"
          className="rounded-xl border-secondary text-primary"
        >
          <HugeiconsIcon icon={Add01Icon} size={18} />
        </Button>
      </div>

      {customUrl && (
        <div className="text-[10px] mt-1 font-medium transition-all duration-200">
          {isValidating && (
            <span className="text-muted-foreground animate-pulse">
              🔍 Checking source availability...
            </span>
          )}
          {validationError && (
            <span className="text-destructive font-semibold">
              ❌ Error: {validationError}
            </span>
          )}
          {isValidated && (
            <span className="text-emerald-500 font-bold">
              ✅ Valid {detectedType.replace("_", " ")} source detected.
            </span>
          )}
        </div>
      )}

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
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => source.url && onRemoveSource(source.url)}
                className="text-destructive hover:bg-destructive/10"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
