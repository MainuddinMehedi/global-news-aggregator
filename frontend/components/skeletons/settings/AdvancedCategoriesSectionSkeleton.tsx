import { CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdvancedCategoriesSectionSkeleton() {
  return (
    <CardContent className="p-6 space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-5 w-32 rounded-md animate-pulse" />
        <Skeleton className="h-4 w-64 rounded-md animate-pulse" />
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full animate-pulse" />
        ))}
      </div>
    </CardContent>
  );
}
