import { PresentationBarChart01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function DiversityInsightWidget() {
  return (
    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
      <div className="flex items-center space-x-2 mb-2">
        <HugeiconsIcon
          icon={PresentationBarChart01FreeIcons}
          className="w-4 h-4 text-primary"
        />
        <span className="text-xs font-bold text-primary">
          Diversity Insight
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Balanced coverage detected for active stories. Western and Non-Western
        sources are equally represented in the current clusters.
      </p>
    </div>
  );
}
