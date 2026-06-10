"use client";

import { useSettings, type CustomSource } from "@/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";

interface ManageSourcesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ManageSourcesModal({ isOpen, onOpenChange }: ManageSourcesModalProps) {
  const { settings, setSetting } = useSettings();
  const sources = settings.customSources || [];

  const toggleSource = (id: string, enabled: boolean) => {
    const updated = sources.map(s => s.id === id ? { ...s, enabled } : s);
    setSetting("customSources", updated);
  };

  const removeSource = (id: string) => {
    const updated = sources.filter(s => s.id !== id);
    setSetting("customSources", updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Sources</DialogTitle>
          <DialogDescription>
            Enable, disable, or remove your customized RSS feeds.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 py-4 scrollbar-sleek">
          {sources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No custom sources added yet.
            </div>
          ) : (
            sources.map(source => (
              <div key={source.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{source.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{source.url}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {source.country}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground uppercase">
                      {source.priority} priority
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                  <Switch 
                    checked={source.enabled} 
                    onCheckedChange={(checked) => toggleSource(source.id, checked)}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeSource(source.id)}
                  >
                    <HugeiconsIcon icon={Delete01Icon} className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
