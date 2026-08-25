"use client";

import { useSession } from "next-auth/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function SuspensionWarning() {
  const { data: session } = useSession();

  if (session?.user?.suspended !== true) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 rounded-lg transition-colors cursor-pointer animate-pulse focus:outline-none">
          <HugeiconsIcon icon={Alert01Icon} className="w-5 h-5 animate-bounce [animation-duration:3s]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 border border-amber-500/20 bg-card/95 backdrop-blur shadow-xl rounded-xl z-50">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-amber-600 flex items-center gap-2">
            <HugeiconsIcon icon={Alert01Icon} className="w-4 h-4" />
            Account Suspended
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You are not allowed to perform this action as your profile got suspended. Your data will be deleted after 30 days. Resolve this within this timeframe or permanently delete your account.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
