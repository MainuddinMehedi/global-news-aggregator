import { StatCardSkeleton } from "./StatCardSkeleton";

export function SummaryStatsSkeleton({
  showUserStats = true,
}: {
  showUserStats?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCardSkeleton />
      {showUserStats && (
        <>
          <StatCardSkeleton />
          <StatCardSkeleton />
        </>
      )}
      <StatCardSkeleton />
    </div>
  );
}
