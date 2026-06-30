import { ScanlineOverlay } from "@/components/analytics/AnalyticsUI";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="relative min-h-full bg-background pb-20 overflow-hidden">
      <ScanlineOverlay />

      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 blur-[100px] rounded-full" />

      <div className="relative z-10 mx-auto w-full max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex gap-1">
                <Skeleton className="w-1.5 h-1.5 rounded-full" />
                <Skeleton className="w-1.5 h-1.5 rounded-full" />
                <Skeleton className="w-1.5 h-1.5 rounded-full" />
              </div>
              <Skeleton className="h-3 w-40 rounded" />
            </div>
            <Skeleton className="h-12 w-64 rounded-xl" />
            <Skeleton className="h-8 w-48 rounded-md mt-2" />
          </div>

          <div className="space-y-2 md:text-right">
            <Skeleton className="h-3 w-20 rounded md:ml-auto" />
            <Skeleton className="h-12 w-28 rounded md:ml-auto" />
            <Skeleton className="h-3 w-32 rounded md:ml-auto" />
          </div>
        </div>

        {/* Summary Stats Cards (4 cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-xl border border-border/40 bg-card/30 p-5 space-y-3"
            >
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          ))}
        </div>

        {/* Section: News Intelligence */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-5">
            <Skeleton className="w-1 h-4 rounded-full" />
            <Skeleton className="h-4 w-40 rounded" />
            <div className="flex-1 h-px bg-border/30" />
          </div>

          {/* Row 1: Event Region (Donut) & Sentiment (Bar) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Region Distribution Skeleton */}
            <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/20 p-6 space-y-6">
              <div className="flex items-center gap-4 mb-5">
                <Skeleton className="w-1 h-4 rounded-full" />
                <Skeleton className="h-3 w-52 rounded" />
                <div className="flex-1 h-px bg-border/30" />
              </div>
              <div className="flex flex-col md:flex-row items-center gap-6 py-4">
                <Skeleton className="h-[200px] w-[200px] rounded-full shrink-0" />
                <div className="w-full space-y-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-2.5 w-2.5 rounded-full" />
                        <Skeleton className="h-3.5 w-24 rounded" />
                      </div>
                      <Skeleton className="h-3.5 w-8 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sentiment Spectrum Skeleton */}
            <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/20 p-6 space-y-6">
              <div className="flex items-center gap-4 mb-5">
                <Skeleton className="w-1 h-4 rounded-full" />
                <Skeleton className="h-3 w-44 rounded" />
                <div className="flex-1 h-px bg-border/30" />
              </div>
              <div className="h-[200px] flex items-end justify-between gap-4 pt-4">
                <Skeleton className="h-[40%] w-full rounded-t-lg" />
                <Skeleton className="h-[60%] w-full rounded-t-lg" />
                <Skeleton className="h-[80%] w-full rounded-t-lg" />
                <Skeleton className="h-[50%] w-full rounded-t-lg" />
                <Skeleton className="h-[30%] w-full rounded-t-lg" />
              </div>
            </div>
          </div>

          {/* Row 2: Bias Leaning (Donut) & Coverage Scope (Donut) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bias Leaning Skeleton */}
            <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/20 p-6 space-y-6">
              <div className="flex items-center gap-4 mb-5">
                <Skeleton className="w-1 h-4 rounded-full" />
                <Skeleton className="h-3 w-48 rounded" />
                <div className="flex-1 h-px bg-border/30" />
              </div>
              <div className="flex flex-col md:flex-row items-center gap-6 py-4">
                <Skeleton className="h-[200px] w-[200px] rounded-full shrink-0" />
                <div className="w-full space-y-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-2.5 w-2.5 rounded-full" />
                        <Skeleton className="h-3.5 w-24 rounded" />
                      </div>
                      <Skeleton className="h-3.5 w-8 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Coverage Scope Skeleton */}
            <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/20 p-6 space-y-6">
              <div className="flex items-center gap-4 mb-5">
                <Skeleton className="w-1 h-4 rounded-full" />
                <Skeleton className="h-3 w-48 rounded" />
                <div className="flex-1 h-px bg-border/30" />
              </div>
              <div className="flex flex-col md:flex-row items-center gap-6 py-4">
                <Skeleton className="h-[200px] w-[200px] rounded-full shrink-0" />
                <div className="w-full space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-2.5 w-2.5 rounded-full" />
                        <Skeleton className="h-3.5 w-24 rounded" />
                      </div>
                      <Skeleton className="h-3.5 w-8 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Source Geography & Coverage by Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Source Geography Skeleton */}
            <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/20 p-6 space-y-6">
              <div className="flex items-center gap-4 mb-5">
                <Skeleton className="w-1 h-4 rounded-full" />
                <Skeleton className="h-3 w-36 rounded" />
                <div className="flex-1 h-px bg-border/30" />
              </div>
              <div className="space-y-4 py-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton className="h-3 w-4 rounded" />
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between">
                        <Skeleton className="h-3.5 w-20 rounded" />
                        <Skeleton className="h-3.5 w-10 rounded" />
                      </div>
                      <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                    <Skeleton className="h-3.5 w-8 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Coverage by Category Skeleton */}
            <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/20 p-6 space-y-6">
              <div className="flex items-center gap-4 mb-5">
                <Skeleton className="w-1 h-4 rounded-full" />
                <Skeleton className="h-3 w-40 rounded" />
                <div className="flex-1 h-px bg-border/30" />
              </div>
              <div className="h-[200px] flex items-end justify-between gap-3 pt-4">
                {Array.from({ length: 8 }).map((_, j) => (
                  <Skeleton
                    key={j}
                    className="w-full rounded-t-lg"
                    style={{ height: `${20 + ((j * 10) % 80)}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Topics & Narratives */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-5">
            <Skeleton className="w-1 h-4 rounded-full" />
            <Skeleton className="h-4 w-44 rounded" />
            <div className="flex-1 h-px bg-border/30" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Topic Sources Skeleton */}
            <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/20 p-6 lg:col-span-1 space-y-6">
              <div className="flex items-center gap-4 mb-5">
                <Skeleton className="w-1 h-4 rounded-full" />
                <Skeleton className="h-3 w-28 rounded" />
                <div className="flex-1 h-px bg-border/30" />
              </div>
              <div className="flex justify-center py-4">
                <Skeleton className="h-[180px] w-[180px] rounded-full" />
              </div>
            </div>

            {/* Top Entities Skeleton */}
            <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/20 p-6 lg:col-span-2 space-y-6">
              <div className="flex items-center gap-4 mb-5">
                <Skeleton className="w-1 h-4 rounded-full" />
                <Skeleton className="h-3 w-28 rounded" />
                <div className="flex-1 h-px bg-border/30" />
              </div>
              <div className="flex flex-wrap gap-2.5 py-2">
                {Array.from({ length: 24 }).map((_, j) => (
                  <Skeleton
                    key={j}
                    className="h-8 rounded-full"
                    style={{ width: `${60 + ((j * 7) % 80)}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <div className="flex-1 h-px bg-border/20" />
          <Skeleton className="h-3.5 w-64 rounded" />
          <div className="flex-1 h-px bg-border/20" />
        </div>
      </div>
    </div>
  );
}
