import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";

interface PaginationErrorProps {
  message?: string;
  onRetry: () => void;
}

export function PaginationError({
  message = "Failed to load more articles. Please check your connection.",
  onRetry,
}: PaginationErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 text-center bg-destructive/5 rounded-xl border border-destructive/10">
      <p className="text-sm font-medium text-destructive mb-3">{message}</p>
      <Button onClick={onRetry} variant="default" className="rounded-full px-6">
        <HugeiconsIcon icon={RefreshIcon} className="mr-2 h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}
