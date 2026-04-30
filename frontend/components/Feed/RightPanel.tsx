import { PerspectiveWidget } from "../widgets/PerspectiveWidget";
import { EventClustersWidget } from "../widgets/EventClustersWidget";
import { BiasDistributionWidget } from "../widgets/BiasDistributionWidget";
import { DiversityInsightWidget } from "../widgets/DiversityInsightWidget";

export default function RightPanel() {
  return (
    <aside className="hidden xl:flex flex-col space-y-4 overflow-y-auto scrollbar-hide pb-10">
      <PerspectiveWidget />
      <EventClustersWidget />
      <BiasDistributionWidget />
      <DiversityInsightWidget />
    </aside>
  );
}
