"use client";

import { toggleBuiltinSourceAction } from "@/app/actions/settings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Globe02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { FeedSource } from "@news/db";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

interface ManageSourcesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dbFeedSources: FeedSource[];
  dbDisabledBuiltinSources: string[];
}

export default function ManageSourcesModal({
  isOpen,
  onOpenChange,
  dbFeedSources = [],
  dbDisabledBuiltinSources = [],
}: ManageSourcesModalProps) {
  const [isPending, startTransition] = useTransition();

  const [optimisticDisabledBuiltins, dispatchBuiltin] = useOptimistic(
    dbDisabledBuiltinSources,
    (state, action: { type: string; payload: any }) => {
      switch (action.type) {
        case "TOGGLE":
          if (action.payload.enabled) {
            return state.filter((url) => url !== action.payload.url);
          } else {
            return [...state, action.payload.url];
          }
        default:
          return state;
      }
    },
  );

  const toggleBuiltinSource = (url: string, enabled: boolean) => {
    startTransition(async () => {
      dispatchBuiltin({ type: "TOGGLE", payload: { url, enabled } });
      try {
        await toggleBuiltinSourceAction(url, enabled);
      } catch (err) {
        toast.error("Failed to update source.");
        console.error(err);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl lg:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Sources</DialogTitle>
          <DialogDescription>
            Enable or disable sources. News from disabled sources won't show up
            in your feed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4 scrollbar-sleek">
          {/* Global Feeds Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Global System Feeds ({dbFeedSources.length})
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {dbFeedSources.map((source) => {
                const isEnabled = !optimisticDisabledBuiltins.includes(
                  source.url,
                );
                return (
                  <div
                    key={source.url}
                    className="flex items-center justify-between p-4 border rounded-xl gap-4 bg-muted/10"
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <HugeiconsIcon
                        icon={Globe02Icon}
                        className="w-5 h-5 text-muted-foreground shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {source.name}
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                            {source.sourceCountry}
                          </span>
                          {source.sourceType && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300">
                              {source.sourceType}
                            </span>
                          )}
                          {source.biasGroup && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                              {source.biasGroup}
                            </span>
                          )}
                          {source.coverageScope && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300">
                              {source.coverageScope}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) =>
                          toggleBuiltinSource(source.url, checked)
                        }
                        disabled={isPending}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
