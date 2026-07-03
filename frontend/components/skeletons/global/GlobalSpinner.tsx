export function GlobalSpinner() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-500">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing rings */}
        <div className="absolute w-16 h-16 rounded-full border border-primary/20 animate-[spin_3s_linear_infinite]" />
        <div className="absolute w-12 h-12 rounded-full border border-primary/40 animate-[spin_2s_linear_infinite_reverse]" />

        {/* Inner core */}
        <div className="w-6 h-6 bg-primary/20 rounded-full animate-pulse backdrop-blur-sm" />
        <div className="absolute w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
      </div>
      <p className="mt-4 text-xs font-medium text-muted-foreground uppercase tracking-widest animate-pulse">
        Initializing...
      </p>
    </div>
  );
}
