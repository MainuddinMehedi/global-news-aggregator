import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon } from "@hugeicons/core-free-icons";

interface StoryAnalysisProps {
  summary: string;
  whyItMatters?: string | null;
}

export function StoryAnalysis({ summary, whyItMatters }: StoryAnalysisProps) {
  return (
    <div className="lg:col-span-8 order-1 rounded-[2.5rem] border border-border bg-card/40 backdrop-blur-xl p-6 md:p-8 shadow-sm space-y-8">
      <div>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-5 flex items-center gap-2">
          <span className="w-8 h-px bg-border" />
          AI Analysis Summary
        </h2>
        <p className="text-base leading-relaxed text-foreground/90">
          {summary}
        </p>
      </div>

      {whyItMatters && (
        <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
            <HugeiconsIcon icon={Alert01Icon} className="h-4 w-4" />
            Why It Matters
          </h2>
          <p className="text-base font-medium leading-relaxed text-foreground">
            {whyItMatters}
          </p>
        </div>
      )}
    </div>
  );
}
