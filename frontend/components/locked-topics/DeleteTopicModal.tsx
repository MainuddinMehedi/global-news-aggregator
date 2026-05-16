"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete01Icon,
  Download01Icon,
  Archive01Icon,
} from "@hugeicons/core-free-icons";

export function DeleteTopicModal({
  topicId,
  topicName,
}: {
  topicId: string;
  topicName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const router = useRouter();

  const handleGenerateSummary = async () => {
    setIsProcessing(true);
    toast.loading("Generating final intelligence summary...", {
      id: "summary-toast",
    });

    try {
      const res = await fetch(`/api/locked-topics/${topicId}/summary`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to generate summary");

      const data = await res.json();
      setSummary(data.summary);
      toast.success("Summary generated successfully.", { id: "summary-toast" });
    } catch (err) {
      toast.error(
        "Failed to summarize. Try again later, or delete without summarizing.",
        { id: "summary-toast" },
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteInstantly = async () => {
    setIsProcessing(true);
    toast.loading("Deleting tracker...", { id: "delete-toast" });

    try {
      const res = await fetch(`/api/locked-topics/${topicId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete topic");

      toast.success("Tracker deleted successfully.", { id: "delete-toast" });
      setIsOpen(false);
      router.push("/locked-topics");
      router.refresh();
    } catch (err) {
      toast.error("An error occurred during deletion.", { id: "delete-toast" });
      setIsProcessing(false);
    }
  };

  const handleDownloadAndDelete = () => {
    if (!summary) return;

    // Download
    const blob = new Blob([summary], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topicName.replace(/\s+/g, "_")}_Final_Report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Delete
    handleDeleteInstantly();
  };

  const handleArchive = async () => {
    if (!summary) return;
    setIsProcessing(true);

    toast.loading("Archiving tracker and saving summary...", {
      id: "archive-toast",
    });

    try {
      const res = await fetch(`/api/locked-topics/${topicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: false,
          aiQuerySummary: summary, // Saving the final report in place of the initial summary
        }),
      });

      if (!res.ok) throw new Error("Failed to archive topic");

      toast.success("Tracker archived successfully.", { id: "archive-toast" });
      setIsOpen(false);
      router.push("/locked-topics");
      router.refresh();
    } catch (err) {
      toast.error("An error occurred during archiving.", {
        id: "archive-toast",
      });
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isProcessing) setIsOpen(open);
        if (!open && summary) {
          // Reset state if closed
          setSummary(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <HugeiconsIcon icon={Delete01Icon} size={18} />
        </Button>
      </DialogTrigger>

      <DialogContent>
        {summary ? (
          <>
            <DialogHeader>
              <DialogTitle>Final Intelligence Report</DialogTitle>
              <DialogDescription>
                Review your final summary. You can archive it to save the report
                to this topic, or download it as Markdown and delete the
                tracker.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[400px] overflow-y-auto p-4 bg-muted/50 rounded-xl text-sm prose dark:prose-invert">
              <pre className="whitespace-pre-wrap font-sans">{summary}</pre>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadAndDelete}
                disabled={isProcessing}
              >
                <HugeiconsIcon
                  icon={Download01Icon}
                  size={16}
                  className="mr-2"
                />
                Download & Delete
              </Button>
              <Button
                onClick={handleArchive}
                disabled={isProcessing}
                className="bg-primary text-primary-foreground"
              >
                <HugeiconsIcon
                  icon={Archive01Icon}
                  size={16}
                  className="mr-2"
                />
                Archive Summary
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Delete Tracker</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this tracker? All associated
                findings and intelligence will be permanently removed.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Before deleting, would you like the AI to generate a final
                executive summary of everything it found during this
                tracker&apos;s lifecycle?
              </p>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteInstantly}
                disabled={isProcessing}
              >
                Delete Instantly
              </Button>
              <Button
                className="bg-primary text-primary-foreground"
                onClick={handleGenerateSummary}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Generate Summary"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
