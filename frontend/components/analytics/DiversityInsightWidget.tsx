import { WidgetListSkeleton } from "@/components/skeletons/home/WidgetListSkeleton";
import { getIngestionStats } from "@/queries/analytics/admin/system";
import { getContentInsights } from "@/queries/analytics/widgets";
import { getSentimentDisplayProps } from "@/utils/analytics";
import { PresentationBarChart01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Suspense } from "react";

export function DiversityInsightWidget() {
  return (
    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <HugeiconsIcon
            icon={PresentationBarChart01FreeIcons}
            className="w-4 h-4 text-primary"
          />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Content Insight
          </span>
        </div>

        <Suspense fallback={<WidgetListSkeleton count={2} />}>
          <DiversityInsightContent />
        </Suspense>
      </div>
    </div>
  );
}

async function DiversityInsightContent() {
  const [insights, ingestion] = await Promise.all([
    getContentInsights(),
    getIngestionStats(),
  ]);

  if (!insights || !ingestion) return null;

  const sentimentProps = getSentimentDisplayProps(
    insights.sentiment.average || 0,
  );

  return (
    <>
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
            Global Sentiment
          </p>

          <div className="flex items-baseline space-x-2">
            <span
              className="text-2xl font-bold"
              style={{ color: sentimentProps.color }}
            >
              {sentimentProps.label}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              ({(insights.sentiment.average || 0).toFixed(2)})
            </span>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
            Ingestion Volume (7d)
          </p>

          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-foreground">
              {ingestion.processedCount}
            </span>
            <span className="text-xs text-muted-foreground">
              articles processed
            </span>
          </div>

          <p className="text-[10px] text-muted-foreground mt-1">
            From {ingestion.rawCount} raw fetches
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-primary/10">
        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
          System is currently maintaining a {ingestion.dedupRate.toFixed(0)}%
          deduplication efficiency.
        </p>
      </div>
    </>
  );
}
