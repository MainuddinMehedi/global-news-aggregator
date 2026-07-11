import { CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SourcesSectionSkeleton() {
  return (
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 rounded-md animate-pulse" />
          <Skeleton className="h-4 w-64 rounded-md animate-pulse" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md animate-pulse" />
      </div>
    </CardContent>
  );
}
