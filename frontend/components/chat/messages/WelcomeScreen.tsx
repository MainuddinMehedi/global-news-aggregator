import {
  MessageSquare,
  PlusSignIcon,
  Robot01Icon,
  Sparkles,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface WelcomeScreenProps {
  onNewChat: () => void;
  onSend: (text: string) => void;
  compact?: boolean;
}

export function WelcomeScreen({
  onNewChat,
  onSend,
  compact = false,
}: WelcomeScreenProps) {
  if (compact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center select-none animate-in fade-in zoom-in-95 duration-500">
        {/* Glowing orb illustration */}
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <HugeiconsIcon
              icon={Robot01Icon}
              className="w-8 h-8 text-primary"
            />
          </div>
          {/* Subtle glow rings */}
          <div className="absolute inset-0 -m-2 rounded-full bg-primary/5 animate-pulse" />
          <div className="absolute inset-0 -m-4 rounded-full bg-primary/[0.02]" />
        </div>

        <h3 className="text-sm font-semibold text-foreground mb-1">
          Welcome to AI Chat
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
          Ask questions about geopolitical events, get multi-perspective
          analysis, or explore trends.
        </p>

        {/* Quick action chips */}
        <div className="flex flex-col gap-1.5 mt-5 w-full max-w-[240px]">
          <button
            onClick={onNewChat}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-muted/30 border border-border/60 text-xs text-foreground hover:bg-muted/50 hover:border-primary/30 transition-all group text-left cursor-pointer"
          >
            <HugeiconsIcon
              icon={PlusSignIcon}
              className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform"
            />
            <span className="font-medium">Start new chat</span>
          </button>

          <button
            onClick={() => onSend("Summarize today's news")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-muted/30 border border-border/60 text-xs text-muted-foreground hover:bg-muted/50 hover:border-border hover:text-foreground transition-all group text-left cursor-pointer"
          >
            <HugeiconsIcon
              icon={Sparkles}
              className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors"
            />
            <span>Summarize today&apos;s news</span>
          </button>

          <button
            onClick={() => onSend("What are the latest geopolitical trends?")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-muted/30 border border-border/60 text-xs text-muted-foreground hover:bg-muted/50 hover:border-border hover:text-foreground transition-all group text-left cursor-pointer"
          >
            <HugeiconsIcon
              icon={MessageSquare}
              className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors"
            />
            <span>Latest geopolitical trends</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 text-center select-none animate-in fade-in zoom-in-95 duration-500">
      <div className="relative mb-6 sm:mb-8 mt-auto sm:mt-0">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
          <HugeiconsIcon
            icon={Robot01Icon}
            className="w-8 h-8 sm:w-10 sm:h-10 text-primary"
          />
        </div>
        <div className="absolute inset-0 -m-2 sm:-m-3 rounded-3xl bg-primary/5 animate-pulse" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1.5 sm:mb-2">
        AI Analyst
      </h2>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mb-8 sm:mb-10">
        I analyze geopolitical events and trends using live multi-perspective
        data. Start a new conversation or try a quick action below.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg mb-auto sm:mb-0">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-card border border-border/60 hover:border-primary/40 hover:bg-muted/50 transition-all group text-left shadow-sm cursor-pointer"
        >
          <HugeiconsIcon
            icon={PlusSignIcon}
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary group-hover:scale-110 transition-transform shrink-0"
          />
          <span className="text-xs sm:text-sm font-medium text-foreground">
            Start a fresh session
          </span>
        </button>

        <button
          onClick={() => onSend("Summarize today's most impactful news")}
          className="flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-card border border-border/60 hover:border-primary/40 hover:bg-muted/50 transition-all group text-left shadow-sm cursor-pointer"
        >
          <HugeiconsIcon
            icon={Sparkles}
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary group-hover:scale-110 transition-transform shrink-0"
          />
          <span className="text-xs sm:text-sm font-medium text-foreground">
            Daily news briefing
          </span>
        </button>

        <button
          onClick={() =>
            onSend("What are the latest developments in the Middle East?")
          }
          className="flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-card border border-border/60 hover:border-primary/40 hover:bg-muted/50 transition-all group text-left shadow-sm sm:col-span-2 cursor-pointer"
        >
          <HugeiconsIcon
            icon={MessageSquare}
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary group-hover:scale-110 transition-transform shrink-0"
          />
          <span className="text-xs sm:text-sm font-medium text-foreground">
            Analyze Middle East developments
          </span>
        </button>
      </div>
    </div>
  );
}
