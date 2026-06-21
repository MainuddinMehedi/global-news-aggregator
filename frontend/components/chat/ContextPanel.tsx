"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Attachment01Icon,
  Cancel01Icon,
  PlusSignIcon,
  File01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { ContextItem } from "@/types/chat";

function ContextCard({
  item,
  onRemove,
}: {
  item: ContextItem;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="group relative bg-background border border-border rounded-xl p-3 shadow-sm hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex shrink-0 items-center justify-center mt-0.5">
          <HugeiconsIcon icon={File01Icon} className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <p className="text-sm font-medium text-foreground truncate">
            {item.title}
          </p>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">
            {item.type}
          </p>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary/70 hover:text-primary truncate block mt-0.5"
            >
              {item.url}
            </a>
          )}
        </div>
      </div>
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center opacity-50 px-4 select-none">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <HugeiconsIcon
          icon={PlusSignIcon}
          className="w-6 h-6 text-muted-foreground"
        />
      </div>
      <p className="text-sm font-medium">No Context Added</p>
      <p className="text-xs mt-1 leading-relaxed">
        Add articles, topics, or links to ground the AI&apos;s analysis.
      </p>
    </div>
  );
}

export function ContextPills({
  items,
  onRemove,
  className,
}: {
  items: ContextItem[];
  onRemove: (id: string) => void;
  className?: string;
}) {
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
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent rounded-full text-xs shrink-0 border border-border/50 shadow-sm"
        >
          <HugeiconsIcon
            icon={File01Icon}
            className="w-3.5 h-3.5 text-primary"
          />
          <span className="truncate max-w-[140px] font-medium">
            {item.title}
          </span>
          <button
            onClick={() => onRemove(item.id)}
            aria-label={`Remove ${item.title}`}
            className="hover:text-destructive transition-colors ml-1 shrink-0"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

interface ContextPanelProps {
  items: ContextItem[];
  onRemove: (id: string) => void;
  onAdd: () => void;
}

export default function ContextPanel({
  items,
  onRemove,
  onAdd,
}: ContextPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className={cn(
        "hidden lg:flex shrink-0 h-[80vh] max-h-[700px] self-center relative transition-all duration-300 ease-in-out",
        isOpen ? "w-80 mr-4" : "w-7 mr-4"
      )}
    >
      {/* Panel - unified rounded floating card */}
      <div
        className={cn(
          "w-full flex flex-col rounded-2xl border border-border bg-background overflow-hidden shadow-sm h-full transition-all duration-300 ease-in-out origin-right",
          isOpen
            ? "opacity-100 scale-100 translate-x-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-x-4 pointer-events-none absolute right-0 inset-y-0"
        )}
      >
        <div className="h-14 border-b border-border flex items-center px-4 justify-between shrink-0">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <HugeiconsIcon
              icon={Attachment01Icon}
              className="w-4 h-4 text-primary"
            />
            Active Context
          </h2>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium tabular-nums">
            {items.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {items.length === 0 ? (
            <EmptyState />
          ) : (
            items.map((item) => (
              <ContextCard key={item.id} item={item} onRemove={onRemove} />
            ))
          )}
        </div>

        <div className="p-4 border-t border-border shrink-0">
          <button
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-accent transition-all"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
            Add Context
          </button>
        </div>
      </div>

      {/* Toggle Button — Floating absolutely on the left border */}
      <button
        onClick={() => setIsOpen(false)}
        aria-label="Close context panel"
        className={cn(
          "absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-6 h-12 rounded-full border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground shadow-md flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 group",
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-75 pointer-events-none"
        )}
      >
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
        />
      </button>

      {/* Standalone toggle when closed — sleek vertical tab design */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open context panel"
        className={cn(
          "h-32 w-7 rounded-l-xl border border-r-0 border-border bg-background/80 backdrop-blur-md hover:bg-accent flex flex-col items-center justify-between py-3.5 shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer hover:w-8 absolute right-0 top-1/2 -translate-y-1/2 origin-right",
          !isOpen
            ? "opacity-100 scale-100 translate-x-0 pointer-events-auto"
            : "opacity-0 scale-90 translate-x-4 pointer-events-none"
        )}
      >
        <HugeiconsIcon
          icon={ArrowLeft01Icon}
          className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:-translate-x-0.5 duration-200"
        />

        <span className="[writing-mode:vertical-lr] text-[9px] font-bold tracking-widest text-muted-foreground/60 uppercase group-hover:text-primary/80 transition-colors select-none">
          Context
        </span>

        {items.length > 0 ? (
          <span className="w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
            {items.length}
          </span>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 group-hover:bg-primary/50 transition-colors" />
        )}
      </button>
    </div>
  );
}
