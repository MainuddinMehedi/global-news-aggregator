import { useState, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  CheckmarkCircle02Icon,
  LockIcon,
} from "@hugeicons/core-free-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  GUEST_ALLOWED_MODELS,
  type ModelMetadata,
} from "@/lib/ai/modelRegistry";
import { cn } from "@/lib/utils";

interface ModelPickerProps {
  models: ModelMetadata[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  isGuest?: boolean;
}

export function ModelPicker({
  models,
  selectedModel,
  onModelChange,
  isGuest = false,
}: ModelPickerProps) {
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const activeModel =
    models.find((model) => model.id === selectedModel) ?? models[0];

  const displayModels = useMemo(() => {
    if (!isGuest) return models;

    return [...models].sort((a, b) => {
      const aAllowed = GUEST_ALLOWED_MODELS.includes(a.id);
      const bAllowed = GUEST_ALLOWED_MODELS.includes(b.id);

      if (aAllowed && !bAllowed) return -1;
      if (!aAllowed && bAllowed) return 1;

      return 0;
    });
  }, [models, isGuest]);

  return (
    <Popover open={modelPickerOpen} onOpenChange={setModelPickerOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Choose model"
          className="h-8 sm:h-8.5 max-w-[130px] sm:max-w-[180px] inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-background text-foreground px-2 sm:px-3 text-[11px] sm:text-xs font-medium hover:bg-accent transition-colors border border-border/70"
        >
          <span className="truncate">{activeModel?.label}</span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className={cn(
              "w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground transition-transform shrink-0",
              modelPickerOpen && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-[245px] gap-0 rounded-xl border border-border/80 bg-popover p-1 shadow-2xl"
      >
        <TooltipProvider delayDuration={150}>
          <div className="max-h-[320px] overflow-y-auto scrollbar-sleek">
            {displayModels.map((model) => {
              const isSelected = model.id === selectedModel;
              const isRestricted =
                isGuest && !GUEST_ALLOWED_MODELS.includes(model.id);

              const btn = (
                <button
                  key={model.id}
                  type="button"
                  disabled={isRestricted}
                  onClick={() => {
                    if (isRestricted) return;
                    onModelChange(model.id);
                    setModelPickerOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    isSelected
                      ? "bg-accent/70 text-foreground"
                      : "hover:bg-accent/60",
                    isRestricted &&
                      "opacity-50 cursor-help hover:bg-transparent",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 truncate text-sm font-medium leading-5">
                      {model.label}
                      {isRestricted && (
                        <HugeiconsIcon
                          icon={LockIcon}
                          className="w-3.5 h-3.5 text-muted-foreground shrink-0"
                        />
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {model.description}
                    </span>
                  </span>
                  {isSelected && (
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    />
                  )}
                </button>
              );

              if (isRestricted) {
                return (
                  <Tooltip key={model.id}>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">{btn}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      Sign in to access all models
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return btn;
            })}
          </div>
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  );
}
