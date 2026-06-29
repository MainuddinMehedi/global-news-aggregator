interface Props {
  data: {
    totalSessions: number;
    totalMessages: number;
    totalToolRuns: number;
    activeModels: { model: string; count: number }[];
  };
}

export function ChatTelemetryWidget({ data }: Props) {
  const topModel = data.activeModels[0]?.model.split("/").pop() || "None";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-5 rounded-xl bg-card/30 border border-border/40 hover:border-primary/40 transition-colors">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Sessions</p>
        <p className="text-3xl font-black font-mono text-foreground">{data.totalSessions}</p>
      </div>
      <div className="p-5 rounded-xl bg-card/30 border border-border/40 hover:border-primary/40 transition-colors">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Messages</p>
        <p className="text-3xl font-black font-mono text-foreground">{data.totalMessages}</p>
      </div>
      <div className="p-5 rounded-xl bg-card/30 border border-border/40 hover:border-primary/40 transition-colors">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Tool Runs</p>
        <p className="text-3xl font-black font-mono text-primary">{data.totalToolRuns}</p>
      </div>
      <div className="p-5 rounded-xl bg-card/30 border border-border/40 hover:border-primary/40 transition-colors">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Top Model</p>
        <p className="text-sm font-bold truncate mt-4 text-foreground/80 capitalize">{topModel}</p>
      </div>
    </div>
  );
}
