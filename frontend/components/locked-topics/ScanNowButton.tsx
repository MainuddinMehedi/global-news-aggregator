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
    toast.info("Scan initiated. This may take a few moments...");

    try {
      const res = await fetch(`/api/locked-topics/${topicId}/scan`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Scan failed to start");

      toast.success("Scan completed in the background.");
      // Refresh the page to show new findings if any
      router.refresh();
    } catch (err) {
      toast.error("Failed to initiate scan.");
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
