import { getPerspectiveCounts } from "@/queries/analytics";
import PerspectiveList from "./PerspectiveList";
import { Suspense } from "react";
import { Skeleton } from "../ui/skeleton";

export async function PerspectiveWidget() {
  const counts = await getPerspectiveCounts();

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
        Sources by Perspective
      </h3>
      <Suspense fallback={<PerspectiveListSkeleton />}>
        <PerspectiveList counts={counts} />
      </Suspense>
    </div>
  );
}

function PerspectiveListSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-xl" />
      ))}
    </div>
  );
}
