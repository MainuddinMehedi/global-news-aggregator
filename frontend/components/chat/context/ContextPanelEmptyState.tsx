import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function ContextPanelEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center opacity-50 px-4 select-none">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <HugeiconsIcon
          icon={PlusSignIcon}
          className="w-6 h-6 text-muted-foreground"
        />
      </div>
      <p className="text-sm font-medium">No Context Added</p>
      <p className="text-xs mt-1 leading-relaxed">
        Add articles, topics, or links to ground the AI&apos;s analysis.
      </p>
    </div>
  );
}
