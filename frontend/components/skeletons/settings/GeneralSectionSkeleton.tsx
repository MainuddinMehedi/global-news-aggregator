import { CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function GeneralSectionSkeleton() {
  return (
    <CardContent className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full animate-pulse" />
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-5 w-32 rounded-md animate-pulse" />
          <Skeleton className="h-4 w-48 rounded-md animate-pulse" />
        </div>
      </div>
      <div className="h-[1px] bg-border my-4" />
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-[150px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <Skeleton className="h-10 w-[180px]" />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-[150px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-9 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    </CardContent>
  );
}
