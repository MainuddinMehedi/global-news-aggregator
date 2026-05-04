"use client";

import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export function InterceptedModal({ children, topicId }: { children: React.ReactNode, topicId: string }) {
  const router = useRouter();

  function onOpenChange(open: boolean) {
    if (!open) {
      router.back();
    }
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-background/80 backdrop-blur-sm" />
      <DialogContent className="flex max-h-[90vh] w-[95vw] sm:max-w-6xl flex-col overflow-hidden border-border bg-card/50 p-0 shadow-2xl backdrop-blur-xl focus-visible:outline-none sm:h-[90vh] sm:rounded-3xl">
        <DialogTitle className="sr-only">Topic Details for {topicId}</DialogTitle>
        <DialogDescription className="sr-only">Detailed analytics and findings for the {topicId} topic.</DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}
