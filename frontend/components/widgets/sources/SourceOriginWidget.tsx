import { WidgetListSkeleton } from "@/components/skeletons/home/WidgetListSkeleton";
import SourceOriginList from "@/components/widgets/sources/SourceOriginList";
import { getSourceOriginCounts } from "@/queries/analytics";
import { Suspense } from "react";

export function SourceOriginWidget() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
        Regions
      </h3>
      <Suspense fallback={<WidgetListSkeleton count={5} />}>
        <SourceOriginContent />
      </Suspense>
    </div>
  );
}

async function SourceOriginContent() {
  const countsData = await getSourceOriginCounts();
  return <SourceOriginList countsData={countsData} />;
}
