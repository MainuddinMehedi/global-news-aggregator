import { PanelSkeleton } from "./PanelSkeleton";

export function TopicsNarrativesSkeleton({
  showUserStats = true,
}: {
  showUserStats?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {showUserStats && <PanelSkeleton className="lg:col-span-1" />}
      <PanelSkeleton
        className={showUserStats ? "lg:col-span-2" : "lg:col-span-3"}
      />
    </div>
  );
}
