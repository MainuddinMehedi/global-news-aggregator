import { getSourceOriginCounts } from "@/queries/analytics";
import SourceOriginList from "@/components/widgets/sources/SourceOriginList";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export async function SourceOriginWidget() {
  const countsData = await getSourceOriginCounts();

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
        Regions
      </h3>
      <Suspense fallback={<SourceOriginListSkeleton />}>
        <SourceOriginList countsData={countsData} />
      </Suspense>
    </div>
  );
}

function SourceOriginListSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-xl" />
      ))}
    </div>
  );
}
