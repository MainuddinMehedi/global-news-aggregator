import KeyDevelopmentsTimeline from "@/components/stories/timeline/KeyDevelopmentsTimeline";

interface KeyDevelopment {
  title: string;
  date: string;
  description?: string;
}

interface StoryTimelineSidebarProps {
  developments: KeyDevelopment[];
}

export function StoryTimelineSidebar({ developments }: StoryTimelineSidebarProps) {
  return (
    <div className="lg:col-span-4 order-2 lg:row-span-3 lg:sticky lg:top-6 lg:self-start">
      <div className="rounded-[2.5rem] border border-border bg-card/40 backdrop-blur-xl p-8 shadow-sm max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-hide">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-8 flex items-center gap-2">
          <span className="w-4 h-px bg-border" />
          Timeline of Developments
        </h3>
        <KeyDevelopmentsTimeline
          developments={developments}
          showTitle={false}
        />
      </div>
    </div>
  );
}
