"use client";

import { useEffect, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveFeedSource } from "@/app/actions/admin/feeds";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AddEditFeedModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  source: any | null;
}

export default function AddEditFeedModal({ isOpen, onOpenChange, source }: AddEditFeedModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [sourceCountry, setSourceCountry] = useState("");
  const [sourceType, setSourceType] = useState("Commercial Publisher");
  const [biasGroup, setBiasGroup] = useState("Centrist");
  const [coverageScope, setCoverageScope] = useState("National");

  useEffect(() => {
    if (source) {
      setName(source.name);
      setUrl(source.url);
      setSourceCountry(source.sourceCountry);
      setSourceType(source.sourceType);
      setBiasGroup(source.biasGroup);
      setCoverageScope(source.coverageScope);
    } else {
      setName("");
      setUrl("");
      setSourceCountry("");
      setSourceType("Commercial Publisher");
      setBiasGroup("Centrist");
      setCoverageScope("National");
    }
  }, [source, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !url.trim() || !sourceCountry.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    startTransition(async () => {
      const res = await saveFeedSource({
        id: source?.id,
        name: name.trim(),
        url: url.trim(),
        sourceCountry: sourceCountry.trim().toUpperCase(),
        sourceType,
        biasGroup,
        coverageScope,
      });

      if (res.success) {
        toast.success(source ? "Feed source updated successfully." : "New feed source added successfully.");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(`Error saving: ${res.error}`);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-popover text-popover-foreground border-border rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">
            {source ? "Edit Feed Source" : "Add New Feed Source"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure geopolitical RSS feed parameters. Name and URL must be unique.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">Feed Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Al Jazeera English"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              className="bg-muted/40 border-border rounded-xl focus:ring-primary focus:border-primary text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="url" className="text-xs font-semibold">Feed URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="e.g. https://www.aljazeera.com/xml/rss/all.xml"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isPending}
              className="bg-muted/40 border-border rounded-xl focus:ring-primary focus:border-primary text-sm font-mono text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-xs font-semibold">Source Country *</Label>
              <Input
                id="country"
                placeholder="e.g. QA, US, GB, RU"
                value={sourceCountry}
                onChange={(e) => setSourceCountry(e.target.value)}
                disabled={isPending}
                className="bg-muted/40 border-border rounded-xl focus:ring-primary focus:border-primary text-sm uppercase"
                maxLength={3}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="scope" className="text-xs font-semibold">Coverage Scope</Label>
              <select
                id="scope"
                value={coverageScope}
                onChange={(e) => setCoverageScope(e.target.value)}
                disabled={isPending}
                className="flex h-10 w-full rounded-xl border border-input bg-muted/40 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
              >
                <option value="Local">Local</option>
                <option value="Regional">Regional</option>
                <option value="National">National</option>
                <option value="Global">Global</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-xs font-semibold">Source Type</Label>
              <select
                id="type"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                disabled={isPending}
                className="flex h-10 w-full rounded-xl border border-input bg-muted/40 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
              >
                <option value="Commercial Publisher">Commercial Publisher</option>
                <option value="State Media">State Media</option>
                <option value="Independent Agency">Independent Agency</option>
                <option value="Government Official">Government Official</option>
                <option value="Alternative Media">Alternative Media</option>
                <option value="Think Tank">Think Tank</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bias" className="text-xs font-semibold">Bias Leaning Profile</Label>
              <select
                id="bias"
                value={biasGroup}
                onChange={(e) => setBiasGroup(e.target.value)}
                disabled={isPending}
                className="flex h-10 w-full rounded-xl border border-input bg-muted/40 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
              >
                <option value="Left-leaning">Left-leaning</option>
                <option value="Centrist">Centrist</option>
                <option value="Right-leaning">Right-leaning</option>
                <option value="State-Aligned">State-Aligned</option>
                <option value="State-Controlled">State-Controlled</option>
              </select>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border/20 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="text-xs font-semibold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? "Saving..." : source ? "Update Feed" : "Add Feed"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
