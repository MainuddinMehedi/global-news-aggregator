"use client";

import { useState, useTransition, useOptimistic } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CANONICAL_REGIONS } from "@/lib/constants";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import ManageSourcesModal from "./ManageSourcesModal";
import { addCustomSourceAction } from "@/app/actions/settings";

interface SourcesSectionProps {
  dbCustomSources: any[];
  dbDisabledBuiltinSources: string[];
}

export default function SourcesSection({ dbCustomSources = [], dbDisabledBuiltinSources = [] }: SourcesSectionProps) {
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Optimistic UI state
  const [optimisticSources, addOptimisticSource] = useOptimistic(
    dbCustomSources,
    (state, newSource: any) => [...state, newSource]
  );
  
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newSourceOrigin, setNewSourceOrigin] = useState("");

  const handleAddSource = () => {
    if (!newName || !newUrl || !newCountry || !newSourceOrigin) {
      toast.error("Please fill in all fields to add a source.");
      return;
    }

    try {
      new URL(newUrl); // basic validation
    } catch {
      toast.error("Please enter a valid URL.");
      return;
    }

    const matchedOrigin = CANONICAL_REGIONS.find(
      (r) => r.toLowerCase() === newSourceOrigin.trim().toLowerCase()
    );

    if (!matchedOrigin) {
      toast.error(
        `Invalid Source Origin. Must be one of: ${CANONICAL_REGIONS.join(", ")}`
      );
      return;
    }

    const newSource = {
      id: crypto.randomUUID(),
      name: newName,
      url: newUrl,
      country: newCountry,
      sourceOrigin: matchedOrigin,
      enabled: true,
    };

    startTransition(async () => {
      addOptimisticSource(newSource);
      try {
        await addCustomSourceAction(newSource);
        toast.success("Source added successfully!");
      } catch (err) {
        toast.error("Failed to add source.");
        console.error(err);
      }
    });
    
    setNewName("");
    setNewUrl("");
    setNewCountry("");
    setNewSourceOrigin("");
  };

  return (
    <>
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Add New RSS Source</Label>
              <p className="text-sm text-muted-foreground">Add customized feeds. They will be integrated with your personal news pipeline.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Source Name</Label>
                <Input placeholder="e.g. The Verge" value={newName} onChange={e => setNewName(e.target.value)} disabled={isPending} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Country</Label>
                <Input placeholder="e.g. USA or Global" value={newCountry} onChange={e => setNewCountry(e.target.value)} disabled={isPending} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs">RSS Feed URL</Label>
                <Input placeholder="https://..." value={newUrl} onChange={e => setNewUrl(e.target.value)} disabled={isPending} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs">Source Origin</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground inline-flex items-center">
                          <HugeiconsIcon icon={InformationCircleIcon} className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="p-3 max-w-xs space-y-1 bg-popover border text-popover-foreground rounded-lg shadow-md">
                        <p className="font-semibold text-xs">Canonical Regions:</p>
                        <ul className="text-[10px] list-disc list-inside space-y-0.5 text-muted-foreground">
                          {CANONICAL_REGIONS.map(region => (
                            <li key={region}>{region}</li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input 
                  placeholder={`e.g. North America, Global (${CANONICAL_REGIONS.slice(0, 3).join(", ")}...)`} 
                  value={newSourceOrigin} 
                  onChange={e => setNewSourceOrigin(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>

            <Button onClick={handleAddSource} className="w-full md:w-auto" disabled={isPending}>
              {isPending ? "Adding..." : "Add Source"}
            </Button>
          </div>

          <div className="pt-4 border-t border-border/50 flex items-center justify-between">
            <div className="space-y-1">
              <Label>Manage Sources</Label>
              <p className="text-sm text-muted-foreground">
                You have {optimisticSources.length} custom sources configured.
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsManageModalOpen(true)}>
              View & Modify
            </Button>
          </div>
        </CardContent>
      </Card>

      <ManageSourcesModal 
        isOpen={isManageModalOpen} 
        onOpenChange={setIsManageModalOpen}
        dbCustomSources={dbCustomSources}
        dbDisabledBuiltinSources={dbDisabledBuiltinSources}
      />
    </>
  );
}

