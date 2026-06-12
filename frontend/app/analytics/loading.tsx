
function ScanlineOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)",
      }}
    />
  );
}

export default function AnalyticsLoading() {
  return (
    <div className="relative min-h-full bg-background pb-20 overflow-hidden">
      <ScanlineOverlay />
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 blur-[100px] rounded-full" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="h-4 w-32 bg-muted/20 rounded animate-pulse" />
            <div className="h-12 w-64 bg-muted/20 rounded animate-pulse" />
            <div className="h-8 w-48 bg-muted/20 rounded-md animate-pulse mt-4" />
          </div>
          <div className="space-y-2 text-right">
            <div className="h-3 w-20 bg-muted/20 rounded animate-pulse ml-auto" />
            <div className="h-10 w-24 bg-muted/20 rounded animate-pulse ml-auto" />
            <div className="h-3 w-32 bg-muted/20 rounded animate-pulse ml-auto" />
          </div>
        </div>

        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-card/20 border border-border/20 animate-pulse" />
          ))}
        </div>

        {/* Main Panels Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-96 rounded-2xl bg-card/20 border border-border/20 animate-pulse" />
          <div className="lg:col-span-2 h-96 rounded-2xl bg-card/20 border border-border/20 animate-pulse" />
        </div>
        
        {/* Single Row Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-card/20 border border-border/20 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
