import { cn } from "@/lib/utils";

const sourcesByPerspective = [
  {
    id: "all",
    label: "All Sources",
    count: 10,
    color: "bg-muted-foreground/50",
    active: true,
  },
  { id: "wire", label: "Wire Services", count: 0, color: "bg-orange-500" },
  { id: "western", label: "Western", count: 3, color: "bg-blue-500" },
  {
    id: "non-western",
    label: "Non-Western",
    count: 3,
    color: "bg-emerald-500",
  },
  { id: "eastern", label: "Eastern", count: 4, color: "bg-red-500" },
];

export function PerspectiveWidget() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
        Sources by Perspective
      </h3>
      <div className="space-y-1.5">
        {sourcesByPerspective.map((item) => (
          <button
            key={item.id}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl transition-all group",
              item.active
                ? "bg-primary/10 border border-primary/20"
                : "hover:bg-muted border border-transparent",
            )}
          >
            <div className="flex items-center space-x-3">
              <div className={cn("w-2 h-2 rounded-full", item.color)} />
              <span
                className={cn(
                  "text-sm font-medium",
                  item.active
                    ? "text-foreground"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                {item.label}
              </span>
            </div>
            <span
              className={cn(
                "text-xs font-mono px-2 py-0.5 rounded-full",
                item.active
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
