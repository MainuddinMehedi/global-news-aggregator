"use client";

import { useState } from "react";
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
import { CleanIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ClearFindingsModalProps {
  topicId: string;
  topicName: string;
}

export function ClearFindingsModal({
  topicId,
  topicName,
}: ClearFindingsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleClear = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/locked-topics/${topicId}/findings`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to clear findings");

      toast.success(`Findings for "${topicName}" cleared successfully.`);
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear findings. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl text-muted-foreground hover:text-primary transition-all group"
          title="Clear all findings"
        >
          <HugeiconsIcon
            icon={CleanIcon}
            size={18}
            className="group-hover:scale-110 transition-transform"
          />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clear all findings?</DialogTitle>
          <DialogDescription className="leading-relaxed">
            This will permanently delete all current findings for{" "}
            <span className="font-bold text-foreground underline decoration-primary/30">
              {topicName}
            </span>
            . This action cannot be undone. You can start a fresh scan
            immediately after.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Keep Findings
          </Button>
          <Button
            variant="destructive"
            onClick={handleClear}
            disabled={isDeleting}
          >
            {isDeleting ? "Clearing..." : "Clear Everything"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
