"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { RssLockedIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ScanNowButtonProps {
  topicId: string;
}

export function ScanNowButton({ topicId }: ScanNowButtonProps) {
  const [isScanning, setIsScanning] = useState(false);
  const router = useRouter();

  const handleScanNow = async () => {
    setIsScanning(true);
    const toastId = toast.info(
      "Scan initiated. This may take a few moments...",
      {
        duration: Infinity,
      },
    );

    try {
      const res = await fetch(`/api/locked-topics/${topicId}/scan`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Scan failed to queue");

      const data = await res.json();
      const jobId = data.jobId;

      if (!jobId) {
        throw new Error("No job ID returned");
      }

      // Poll for completion
      let isDone = false;
      let finalCount = 0;
      
      while (!isDone) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        
        const statusRes = await fetch(`/api/locked-topics/${topicId}/scan/status?jobId=${jobId}`);
        if (!statusRes.ok) throw new Error("Status fetch failed");
        
        const statusData = await statusRes.json();
        
        if (statusData.state === "completed") {
          isDone = true;
          finalCount = statusData.count || 0;
        } else if (statusData.state === "failed" || statusData.state === "cancelled") {
          throw new Error(`Scan ${statusData.state}`);
        }
      }

      if (finalCount > 0) {
        toast.success(`Scan completed! Found ${finalCount} new items.`, {
          id: toastId,
          duration: 5000,
        });
      } else {
        toast.info("No new items found. We'll keep looking periodically!", {
          id: toastId,
          duration: 5000,
        });
      }

      // Refresh the page to show new findings if any
      router.refresh();
    } catch (err) {
      toast.error("Failed to complete scan.", { id: toastId });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Button
      size="sm"
      className="gap-2 rounded-xl shadow-lg shadow-primary/20 h-10 px-5 font-bold"
      onClick={handleScanNow}
      disabled={isScanning}
    >
      <HugeiconsIcon icon={RssLockedIcon} size={16} />
      {isScanning ? "Scanning..." : "Scan Now"}
    </Button>
  );
}
