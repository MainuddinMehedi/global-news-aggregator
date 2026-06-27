import { Card, CardContent } from "@/components/ui/card";

export function NotificationsPageSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filters Skeleton */}
      <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-4 rounded-lg animate-pulse">
        <div className="h-9 w-28 bg-muted-foreground/20 rounded-md" />
        <div className="h-9 w-32 bg-muted-foreground/20 rounded-md" />
        <div className="ml-auto h-9 w-32 bg-muted-foreground/20 rounded-md" />
      </div>

      {/* List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="border border-border bg-card animate-pulse">
            <CardContent className="p-4 flex items-start gap-4">
              <div className="h-9 w-9 bg-muted/50 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-muted/50 rounded w-1/4" />
                <div className="h-3 bg-muted/30 rounded w-3/4" />
                <div className="h-3 bg-muted/20 rounded w-1/6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
