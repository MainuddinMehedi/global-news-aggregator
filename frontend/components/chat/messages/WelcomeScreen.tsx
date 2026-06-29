import { HugeiconsIcon } from "@hugeicons/react";
import {
  Robot01Icon,
  PlusSignIcon,
  Sparkles,
  MessageSquare,
} from "@hugeicons/core-free-icons";

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
    <div className="flex-1 flex flex-col items-center justify-center px-6 pt-4 text-center select-none animate-in fade-in zoom-in-95 duration-500">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
          <HugeiconsIcon
            icon={Robot01Icon}
            className="w-10 h-10 text-primary"
          />
        </div>
        <div className="absolute inset-0 -m-3 rounded-3xl bg-primary/5 animate-pulse" />
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-2">AI Analyst</h2>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-md mb-10">
        I analyze geopolitical events and trends using live multi-perspective
        data. Start a new conversation or try a quick action below.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        <button
          onClick={onNewChat}
          className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/40 hover:bg-muted/50 transition-all group text-left shadow-sm cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <HugeiconsIcon
              icon={PlusSignIcon}
              className="w-5 h-5 text-primary group-hover:scale-110 transition-transform"
            />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              New Analysis
            </div>
            <div className="text-xs text-muted-foreground">
              Start a fresh session
            </div>
          </div>
        </button>

        <button
          onClick={() => onSend("Summarize today's most impactful news")}
          className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/40 hover:bg-muted/50 transition-all group text-left shadow-sm cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <HugeiconsIcon
              icon={Sparkles}
              className="w-5 h-5 text-primary group-hover:scale-110 transition-transform"
            />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              Daily Briefing
            </div>
            <div className="text-xs text-muted-foreground">
              Summarize today&apos;s news
            </div>
          </div>
        </button>

        <button
          onClick={() =>
            onSend("What are the latest developments in the Middle East?")
          }
          className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/40 hover:bg-muted/50 transition-all group text-left shadow-sm sm:col-span-2 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <HugeiconsIcon
              icon={MessageSquare}
              className="w-5 h-5 text-primary group-hover:scale-110 transition-transform"
            />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              Middle East Situation
            </div>
            <div className="text-xs text-muted-foreground">
              Analyze the latest regional developments
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
