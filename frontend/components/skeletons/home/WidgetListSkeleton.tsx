import { Skeleton } from "@/components/ui/skeleton";

export function WidgetListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 mt-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  );
}
