export function CorpusSizeSkeleton() {
  return (
    <div className="text-left md:text-right animate-pulse">
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 mb-2">
        Corpus Size
      </p>
      <div className="w-24 h-10 bg-muted rounded-lg ml-auto mb-2" />
      <div className="w-20 h-3 bg-muted rounded-full ml-auto" />
    </div>
  );
}
