import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  TextFontIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ResponseModePickerProps {
  responseMode: "concise" | "descriptive";
  onResponseModeChange: (mode: "concise" | "descriptive") => void;
}

export function ResponseModePicker({
  responseMode,
  onResponseModeChange,
}: ResponseModePickerProps) {
  const [modePickerOpen, setModePickerOpen] = useState(false);

  return (
    <Popover open={modePickerOpen} onOpenChange={setModePickerOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Choose response mode"
          className="h-8 sm:h-8.5 max-w-[120px] sm:max-w-[140px] inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-background text-foreground px-2 sm:px-3 text-[11px] sm:text-xs font-medium hover:bg-accent transition-colors border border-border/70 capitalize"
        >
          <HugeiconsIcon
            icon={TextFontIcon}
            className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground shrink-0"
          />
          <span className="truncate">{responseMode}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-[190px] gap-0 rounded-xl border border-border/80 bg-popover p-1 shadow-2xl"
      >
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => {
              onResponseModeChange("concise");
              setModePickerOpen(false);
            }}
            className={cn(
              "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
              responseMode === "concise"
                ? "bg-accent/70 text-foreground"
                : "hover:bg-accent/60 text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold leading-4">
                Concise
              </span>
              <span className="block text-xs opacity-70 mt-0.5">
                Direct answers, short bullets.
              </span>
            </span>
            {responseMode === "concise" && (
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              onResponseModeChange("descriptive");
              setModePickerOpen(false);
            }}
            className={cn(
              "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
              responseMode === "descriptive"
                ? "bg-accent/70 text-foreground"
                : "hover:bg-accent/60 text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold leading-4">
                Descriptive
              </span>
              <span className="block text-xs opacity-70 mt-0.5">
                Full analysis, timelines, implications.
              </span>
            </span>
            {responseMode === "descriptive" && (
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              />
            )}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
