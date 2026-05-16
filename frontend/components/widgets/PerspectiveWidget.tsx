import { getContentInsights } from "@/queries/analytics";
import { cn } from "@/lib/utils";

export async function PerspectiveWidget() {
  const insights = await getContentInsights();

  if (!insights) return null;

  // Sort categories by count
  const sortedCategories = [...insights.categories]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
        Top Categories
      </h3>
      <div className="space-y-1.5">
        {sortedCategories.map((item) => (
          <div
            key={item.label}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted border border-transparent transition-all group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-primary/40" />
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                {item.label}
              </span>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
