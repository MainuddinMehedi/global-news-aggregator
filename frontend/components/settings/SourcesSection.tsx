"use client";

import { useState } from "react";
import { useSettings } from "@/store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import ManageSourcesModal from "./ManageSourcesModal";

export default function SourcesSection() {
  const { settings, setSetting } = useSettings();
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");

  const handleAddSource = () => {
    if (!newName || !newUrl || !newCountry) {
      toast.error("Please fill in all fields to add a source.");
      return;
    }

    try {
      new URL(newUrl); // basic validation
    } catch {
      toast.error("Please enter a valid URL.");
      return;
    }

    const currentSources = settings.customSources || [];
    const newSource = {
      id: crypto.randomUUID(),
      name: newName,
      url: newUrl,
      country: newCountry,
      priority: newPriority,
      enabled: true,
    };

    setSetting("customSources", [...currentSources, newSource]);
    toast.success("Source added successfully!");
    
    setNewName("");
    setNewUrl("");
    setNewCountry("");
    setNewPriority("medium");
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
                <Input placeholder="e.g. The Verge" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Country</Label>
                <Input placeholder="e.g. USA or Global" value={newCountry} onChange={e => setNewCountry(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs">RSS Feed URL</Label>
                <Input placeholder="https://..." value={newUrl} onChange={e => setNewUrl(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs">Priority</Label>
                <Select value={newPriority} onValueChange={(v: any) => setNewPriority(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleAddSource} className="w-full md:w-auto">Add Source</Button>
          </div>

          <div className="pt-4 border-t border-border/50 flex items-center justify-between">
            <div className="space-y-1">
              <Label>Manage Sources</Label>
              <p className="text-sm text-muted-foreground">
                You have {settings.customSources?.length || 0} custom sources configured.
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
      />
    </>
  );
}
