export function GlobalSpinner() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-700">
      <div className="relative flex items-center justify-center">
        {/* Soft ambient background glow */}
        <div className="absolute inset-0 m-auto w-20 h-20 bg-primary/15 rounded-full blur-2xl animate-pulse" />

        {/* Outer trailing ring */}
        <div className="absolute w-14 h-14 rounded-full border-2 border-transparent border-t-primary border-r-primary/50 animate-[spin_1.5s_cubic-bezier(0.68,-0.55,0.26,1.55)_infinite]" />

        {/* Middle continuous ring */}
        <div className="absolute w-10 h-10 rounded-full border-2 border-transparent border-b-primary border-l-primary/50 animate-[spin_2s_linear_infinite_reverse]" />

        {/* Center glowing core */}
        <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_12px_var(--theme-primary)] animate-pulse" />
      </div>

      <p className="mt-6 text-[11px] font-bold text-primary/70 uppercase tracking-[0.25em] animate-pulse">
        Loading...
      </p>
    </div>
  );
}
