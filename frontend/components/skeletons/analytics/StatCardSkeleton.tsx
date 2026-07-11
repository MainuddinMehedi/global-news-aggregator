export function StatCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm p-5 animate-pulse">
      <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="w-24 h-2 bg-muted rounded-full mb-4" />
      <div className="w-16 h-8 bg-muted rounded-full mb-2" />
      <div className="w-20 h-2 bg-muted rounded-full" />
    </div>
  );
}
