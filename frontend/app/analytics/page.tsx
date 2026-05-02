import { BiasDistributionWidget } from "@/components/widgets/BiasDistributionWidget";
import { DiversityInsightWidget } from "@/components/widgets/DiversityInsightWidget";
import { EventClustersWidget } from "@/components/widgets/EventClustersWidget";
import { PerspectiveWidget } from "@/components/widgets/PerspectiveWidget";

export default function AnalyticsPage() {
  return (
    <div className="p-5 md:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bias distribution, source perspectives, and coverage insights across
          your feed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PerspectiveWidget />
        <BiasDistributionWidget />
        <EventClustersWidget />
        <DiversityInsightWidget />
      </div>
    </div>
  );
}
