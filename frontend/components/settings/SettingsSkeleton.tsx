export default function SettingsSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-10 animate-pulse">
      {/* Sidebar TOC skeleton */}
      <div className="w-full md:w-56 shrink-0 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-9 w-full bg-muted rounded-md"
          />
        ))}
      </div>
      {/* Content cards skeleton */}
      <div className="flex-1 space-y-6 max-w-2xl">
        <div className="h-64 w-full bg-muted rounded-xl" />
        <div className="h-64 w-full bg-muted rounded-xl" />
      </div>
    </div>
  );
}
