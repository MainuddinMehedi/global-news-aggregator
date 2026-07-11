import { CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationsSectionSkeleton() {
  return (
    <CardContent className="p-6 space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-md animate-pulse" />
        <Skeleton className="h-10 w-full rounded-md animate-pulse" />
        <Skeleton className="h-10 w-full rounded-md animate-pulse" />
      </div>
    </CardContent>
  );
}
