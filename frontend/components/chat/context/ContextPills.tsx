import { cn } from "@/lib/utils";
import type { ContextItem } from "@/types/chat";
import { Cancel01Icon, File01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface ContextPillsProps {
  items: ContextItem[];
  onRemove: (id: string) => void;
  onViewContext?: (item: ContextItem) => void;
  className?: string;
}

export function ContextPills({
  items,
  onRemove,
  onViewContext,
  className,
}: ContextPillsProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 hide-scrollbar",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-accent rounded-full text-[10px] sm:text-xs shrink-0 border border-border/50 shadow-sm cursor-pointer hover:bg-accent/80 transition-colors"
          onClick={() => onViewContext?.(item)}
        >
          <HugeiconsIcon
            icon={File01Icon}
            className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary"
          />
          <span className="truncate max-w-[120px] sm:max-w-[140px] font-medium">
            {item.title}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
            aria-label={`Remove ${item.title}`}
            className="hover:text-destructive transition-colors ml-0.5 sm:ml-1 shrink-0"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              className="w-3 h-3 sm:w-3.5 sm:h-3.5"
            />
          </button>
        </div>
      ))}
    </div>
  );
}
