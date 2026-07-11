"use client";

import { cn } from "@/lib/utils";
import type { ContextItem } from "@/types/chat";
import { Attachment01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { ContextCard } from "./ContextCard";
import { ContextPanelEmptyState } from "./ContextPanelEmptyState";
import { ContextPanelToggle } from "./ContextPanelToggle";

interface ContextPanelProps {
  items: ContextItem[];
  onRemove: (id: string) => void;
  onAdd: () => void;
  onViewContext: (item: ContextItem) => void;
}

export default function ContextPanel({
  items,
  onRemove,
  onAdd,
  onViewContext,
}: ContextPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className={cn(
        "hidden lg:flex relative shrink-0 h-[80vh] max-h-[700px] self-center transition-all duration-300 ease-in-out",
        isOpen ? "w-80 mr-4" : "w-7 mr-4",
      )}
    >
      <div
        className={cn(
          "w-80 flex flex-col rounded-2xl border border-border bg-background overflow-hidden shadow-sm h-full transition-all duration-300 ease-in-out origin-right absolute right-0 inset-y-0",
          isOpen
            ? "opacity-100 scale-100 translate-x-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-x-4 pointer-events-none",
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
            <ContextPanelEmptyState />
          ) : (
            items.map((item) => (
              <ContextCard
                key={item.id}
                item={item}
                onRemove={onRemove}
                onClick={() => onViewContext(item)}
              />
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

      <ContextPanelToggle
        isOpen={isOpen}
        itemCount={items.length}
        setIsOpen={setIsOpen}
      />
    </div>
  );
}
