"use client";

import { useTransition, useOptimistic } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon, Globe02Icon, LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { BUILTIN_SOURCES } from "@/lib/constants";
import { 
  toggleCustomSourceAction, 
  removeCustomSourceAction, 
  toggleBuiltinSourceAction 
} from "@/app/actions/settings";
import { toast } from "sonner";

interface ManageSourcesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dbCustomSources: any[];
  dbDisabledBuiltinSources: string[];
}

export default function ManageSourcesModal({ isOpen, onOpenChange, dbCustomSources = [], dbDisabledBuiltinSources = [] }: ManageSourcesModalProps) {
  const [isPending, startTransition] = useTransition();

  const [optimisticCustomSources, dispatchCustom] = useOptimistic(
    dbCustomSources,
    (state, action: { type: string, payload: any }) => {
      switch (action.type) {
        case "TOGGLE":
          return state.map(s => s.id === action.payload.id ? { ...s, enabled: action.payload.enabled } : s);
        case "REMOVE":
          return state.filter(s => s.id !== action.payload);
        default:
          return state;
      }
    }
  );

  const [optimisticDisabledBuiltins, dispatchBuiltin] = useOptimistic(
    dbDisabledBuiltinSources,
    (state, action: { type: string, payload: any }) => {
      switch (action.type) {
        case "TOGGLE":
          if (action.payload.enabled) {
            return state.filter(url => url !== action.payload.url);
          } else {
            return [...state, action.payload.url];
          }
        default:
          return state;
      }
    }
  );

  const toggleCustomSource = (id: string, enabled: boolean) => {
    startTransition(async () => {
      dispatchCustom({ type: "TOGGLE", payload: { id, enabled } });
      try {
        await toggleCustomSourceAction(id, enabled);
      } catch (err) {
        toast.error("Failed to update source.");
        console.error(err);
      }
    });
  };

  const removeCustomSource = (id: string) => {
    startTransition(async () => {
      dispatchCustom({ type: "REMOVE", payload: id });
      try {
        await removeCustomSourceAction(id);
        toast.success("Source removed.");
      } catch (err) {
        toast.error("Failed to remove source.");
        console.error(err);
      }
    });
  };

  const toggleBuiltinSource = (url: string, enabled: boolean) => {
    startTransition(async () => {
      dispatchBuiltin({ type: "TOGGLE", payload: { url, enabled } });
      try {
        await toggleBuiltinSourceAction(url, enabled);
      } catch (err) {
        toast.error("Failed to update built-in source.");
        console.error(err);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Sources</DialogTitle>
          <DialogDescription>
            Enable, disable, or remove custom sources, or toggle built-in news sources.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4 scrollbar-sleek">
          {/* Custom Feeds Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Your Custom Feeds ({optimisticCustomSources.length})
            </h3>
            
            {optimisticCustomSources.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-xl text-sm text-muted-foreground bg-muted/10">
                No custom sources added yet.
              </div>
            ) : (
              <div className="space-y-3">
                {optimisticCustomSources.map((source: any) => (
                  <div key={source.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl gap-4 bg-card">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={LinkSquare01Icon} className="w-4 h-4 text-primary shrink-0" />
                        <h4 className="font-semibold text-sm truncate">{source.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground truncate pl-6">{source.url}</p>
                      <div className="flex flex-wrap gap-2 mt-2 pl-6">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          {source.country}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {source.sourceOrigin}
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
                    
                    <div className="flex items-center gap-4 shrink-0 pl-6 sm:pl-0">
                      <Switch 
                        checked={source.enabled} 
                        onCheckedChange={(checked) => toggleCustomSource(source.id, checked)}
                        disabled={isPending}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeCustomSource(source.id)}
                        disabled={isPending}
                      >
                        <HugeiconsIcon icon={Delete01Icon} className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Built-in Feeds Section */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Built-in System Feeds ({BUILTIN_SOURCES.length})
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {BUILTIN_SOURCES.map(source => {
                const isEnabled = !optimisticDisabledBuiltins.includes(source.url);
                return (
                  <div key={source.url} className="flex items-center justify-between p-4 border rounded-xl gap-4 bg-muted/10">
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <HugeiconsIcon icon={Globe02Icon} className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm truncate">{source.name}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                            {source.country}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {source.sourceOrigin}
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
                        onCheckedChange={(checked) => toggleBuiltinSource(source.url, checked)}
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

