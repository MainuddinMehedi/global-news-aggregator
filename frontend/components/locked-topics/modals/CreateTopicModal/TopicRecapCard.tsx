import { CreateTopicData } from "@/types/lockedTopic";
import { Search01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ConceptBucketsList } from "./ConceptBucketsList";

interface TopicRecapCardProps {
  data: CreateTopicData;
}

export function TopicRecapCard({ data }: TopicRecapCardProps) {
  return (
    <div className="rounded-2xl border border-secondary bg-secondary/10 divide-y divide-secondary/30">
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <HugeiconsIcon icon={SparklesIcon} size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            AI Intelligence Report
          </span>
        </div>
        <p className="text-sm leading-relaxed font-medium italic text-foreground/90">
          &quot;{data.aiQuerySummary}&quot;
        </p>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <HugeiconsIcon icon={Search01Icon} size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Search Strategy
          </span>
        </div>
        <div className="font-mono text-[10px] bg-background/50 p-3 rounded-xl border border-border leading-relaxed text-wrap break-all">
          {data.aiRefinedQuery}
        </div>
      </div>

      {data.conceptualKeywords && data.conceptualKeywords.length > 0 && (
        <div className="p-4 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Concept Buckets
          </span>
          <ConceptBucketsList buckets={data.conceptualKeywords} />
        </div>
      )}

      <div className="p-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
          Sources ({data.sources.length})
        </span>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {data.sources.map((s, i) => (
            <span
              key={i}
              className="text-[9px] font-semibold py-1 px-2 rounded-full bg-secondary border border-secondary-foreground/10 uppercase tracking-wider"
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
