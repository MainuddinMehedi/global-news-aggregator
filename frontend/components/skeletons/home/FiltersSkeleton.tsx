export function FiltersSkeleton() {
  return (
    <div className="space-y-5 w-full">
      {/* Category filter pills skeleton */}
      <div className="flex items-center space-x-2 overflow-hidden rounded">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-[30px] w-20 md:w-28 bg-muted rounded-md animate-pulse shrink-0"
          />
        ))}
      </div>

      {/* Sort control + active filters + live article count skeleton */}
      <div className="flex items-start sm:items-center justify-between gap-4">
        {/* Sort */}
        <div className="shrink-0">
          <div className="h-8 w-[130px] bg-muted animate-pulse rounded-md" />
        </div>

        {/* Active Filters (Middle) */}
        <div className="flex-1 min-w-0 hidden sm:flex justify-center">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-full" />
        </div>

        {/* Count & Popover */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-5 w-20 bg-muted animate-pulse rounded-md hidden sm:block" />
          <div className="h-8 w-[90px] bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    </div>
  );
}
