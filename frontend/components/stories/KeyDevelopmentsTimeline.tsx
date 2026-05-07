interface KeyDevelopment {
  title: string;
  date: string;
  description?: string;
}

interface KeyDevelopmentsTimelineProps {
  developments: KeyDevelopment[];
  showTitle?: boolean;
}

export default function KeyDevelopmentsTimeline({
  developments,
  showTitle = true,
}: KeyDevelopmentsTimelineProps) {
  if (!developments || developments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No key developments tracked yet.
      </p>
    );
  }

  return (
    <>
      {showTitle && (
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
          Key Developments
          <div className="h-px flex-1 bg-border/50"></div>
        </div>
      )}
      <div className="relative ml-2 space-y-6 border-l-2 border-border/60 pl-6">
        {developments.map((dev, index) => (
          <div key={index} className="relative group/timeline">
            <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-muted bg-background ring-4 ring-card transition-colors duration-300 group-hover/timeline:border-primary group-hover/timeline:bg-primary/20" />

            <div className="flex flex-col gap-1">
              <div className="text-sm font-semibold text-foreground/90 transition-colors group-hover/timeline:text-foreground">
                {dev.title}
              </div>
              <div className="text-xs font-medium text-muted-foreground/80 mb-1">
                {dev.date}
              </div>
              {dev.description && (
                <p className="text-xs text-muted-foreground">
                  {dev.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}