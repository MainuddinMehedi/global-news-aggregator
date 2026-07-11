import { HugeiconsIcon } from "@hugeicons/react";
import { File01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import type { ContextItem } from "@/types/chat";

interface ContextCardProps {
  item: ContextItem;
  onRemove: (id: string) => void;
  onClick?: () => void;
}

export function ContextCard({ item, onRemove, onClick }: ContextCardProps) {
  return (
    <div className="group relative bg-background border border-border rounded-xl p-3 shadow-sm hover:border-primary/50 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
      <button
        type="button"
        className="flex items-start gap-3 w-full text-left outline-hidden"
        onClick={onClick}
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex shrink-0 items-center justify-center mt-0.5">
          <HugeiconsIcon icon={File01Icon} className="w-4 h-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <p className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate">
            {item.title}
          </p>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">
            {item.type}
          </p>
          {item.url && (
            <span className="text-[10px] text-muted-foreground/70 truncate block mt-0.5">
              {item.url}
            </span>
          )}
        </div>
      </button>

      <button
        onClick={() => onRemove(item.id)}
        aria-label={`Remove ${item.title}`}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-all"
      >
        <HugeiconsIcon icon={Cancel01Icon} className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
