import { AiUsageStats } from "@/components/widgets/AiUsageStats";
import { BiasDistributionWidget } from "@/components/widgets/BiasDistributionWidget";
import { DiversityInsightWidget } from "@/components/widgets/DiversityInsightWidget";
import { EventClustersWidget } from "@/components/widgets/EventClustersWidget";
import { PerspectiveWidget } from "@/components/widgets/PerspectiveWidget";
import { SourceHealth } from "@/components/widgets/SourceHealth";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsPage() {
  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Intelligence Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitoring system health, AI efficiency, and global news perspectives.
        </p>
      </div>

      <div className="space-y-12">
        {/* Section 1: System Health */}
        <section>
          <div className="flex items-center space-x-2 mb-4 px-1">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              System & AI Pipeline
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Suspense fallback={<WidgetSkeleton />}>
              <SourceHealth />
            </Suspense>
            <Suspense fallback={<WidgetSkeleton />}>
              <AiUsageStats />
            </Suspense>
            <Suspense fallback={<WidgetSkeleton />}>
              <DiversityInsightWidget />
            </Suspense>
          </div>
        </section>

        {/* Section 2: News Intelligence */}
        <section>
          <div className="flex items-center space-x-2 mb-4 px-1">
            <div className="w-1 h-4 bg-emerald-500 rounded-full" />
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              News & Perspective Insights
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Suspense fallback={<WidgetSkeleton />}>
              <EventClustersWidget />
            </Suspense>
            <Suspense fallback={<WidgetSkeleton />}>
              <BiasDistributionWidget />
            </Suspense>
            <Suspense fallback={<WidgetSkeleton />}>
              <PerspectiveWidget />
            </Suspense>
          </div>
        </section>
      </div>
    </div>
  );
}

function WidgetSkeleton() {
  return <Skeleton className="h-[300px] w-full rounded-2xl" />;
}
