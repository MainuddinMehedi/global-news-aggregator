import { cn } from "@/lib/utils";

export function PanelSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/40 bg-card/20 backdrop-blur-sm p-6 animate-pulse min-h-[300px]",
        className,
      )}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary/10 rounded-tl-2xl" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary/10 rounded-tr-2xl" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-primary/10 rounded-bl-2xl" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-primary/10 rounded-br-2xl" />

      {/* Header Skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-4 h-4 bg-muted rounded-sm" />
        <div className="w-32 h-3 bg-muted rounded-full" />
      </div>

      {/* Body Skeleton */}
      <div className="space-y-4">
        <div className="w-full h-8 bg-muted/50 rounded-lg" />
        <div className="w-full h-8 bg-muted/30 rounded-lg" />
        <div className="w-full h-8 bg-muted/20 rounded-lg" />
      </div>
    </div>
  );
}
