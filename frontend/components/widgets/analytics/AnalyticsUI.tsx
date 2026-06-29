import { cn } from "@/lib/utils";

export function ScanlineOverlay() {
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

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm p-5 group hover:border-primary/40 transition-all duration-300">
      <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <p
        className="text-[9px] font-black uppercase tracking-[0.3em] mb-3"
        style={{ color: accent ?? "var(--muted-foreground)" }}
      >
        {label}
      </p>
      <p className="text-4xl font-black tracking-tighter text-foreground font-mono leading-none">
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-muted-foreground mt-2 font-medium">
          {sub}
        </p>
      )}
    </div>
  );
}

export function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-primary opacity-80" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground">
          {title}
        </h2>
      </div>
      {sub && (
        <span className="text-[9px] text-muted-foreground/50 font-mono">
          {sub}
        </span>
      )}
      <div className="flex-1 h-px bg-border/30" />
    </div>
  );
}

export function PanelShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/40 bg-card/20 backdrop-blur-sm p-6",
        className,
      )}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary/30 rounded-tl-2xl" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary/30 rounded-tr-2xl" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-primary/30 rounded-bl-2xl" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-primary/30 rounded-br-2xl" />
      {children}
    </div>
  );
}
