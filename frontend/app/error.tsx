"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center border overflow-hidden p-8">
      <h2 className="text-xl font-bold">Something went wrong!</h2>
      <p className="text-wrap text-muted-foreground">{error.message}</p>
      <Button onClick={() => reset()} className="mt-4">
        Try again
      </Button>
    </div>
  );
}
