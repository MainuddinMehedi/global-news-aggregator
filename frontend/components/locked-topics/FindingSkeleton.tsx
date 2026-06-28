import { Skeleton } from "@/components/ui/skeleton";

export function FindingSkeleton() {
  return (
    <div className="p-6 rounded-[1.5rem] border border-secondary bg-background/50 space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-10 w-20 rounded-2xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-8 w-full rounded-xl" />
        <Skeleton className="h-8 w-4/5 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-5/6 rounded-lg" />
        <Skeleton className="h-4 w-2/3 rounded-lg" />
      </div>
    </div>
  );
}
