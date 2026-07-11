import { cn } from "@/lib/utils";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Dispatch, SetStateAction } from "react";

interface ContextPanelToggleProps {
  isOpen: boolean;
  itemCount: number;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function ContextPanelToggle({
  isOpen,
  itemCount,
  setIsOpen,
}: ContextPanelToggleProps) {
  return (
    <>
      {/* Toggle Button — Floating absolutely on the left border */}
      <button
        onClick={() => setIsOpen(false)}
        aria-label="Close context panel"
        className={cn(
          "absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-6 h-12 rounded-full border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground shadow-md flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 group",
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-75 pointer-events-none",
        )}
      >
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
        />
      </button>

      {/* Standalone toggle when closed — sleek vertical tab design */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open context panel"
        className={cn(
          "h-32 w-7 rounded-l-xl border border-r-0 border-border bg-background/80 backdrop-blur-md hover:bg-accent flex flex-col items-center justify-between py-3.5 shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer hover:w-8 absolute right-0 top-1/2 -translate-y-1/2 origin-right",
          isOpen
            ? "opacity-0 scale-90 translate-x-4 pointer-events-none"
            : "opacity-100 scale-100 translate-x-0 pointer-events-auto",
        )}
      >
        <HugeiconsIcon
          icon={ArrowLeft01Icon}
          className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:-translate-x-0.5 duration-200"
        />

        <span className="[writing-mode:vertical-lr] text-[9px] font-bold tracking-widest text-muted-foreground/60 uppercase group-hover:text-primary/80 transition-colors select-none">
          Context
        </span>

        {itemCount > 0 ? (
          <span className="w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
            {itemCount}
          </span>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 group-hover:bg-primary/50 transition-colors" />
        )}
      </button>
    </>
  );
}
