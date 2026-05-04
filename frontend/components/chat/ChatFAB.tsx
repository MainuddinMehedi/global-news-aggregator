"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { MessageSquare } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useIsChatOpen, useOpenChat } from "@/store";
import { usePathname } from "next/navigation";

export default function ChatFAB() {
  const isOpen = useIsChatOpen();
  const openChat = useOpenChat();
  const pathname = usePathname();

  // Don't show the FAB when the user is already on the full chat page
  if (pathname.startsWith("/chat")) return null;

  return (
    <button
      onClick={openChat}
      aria-label="Open AI Chat"
      className={cn(
        // Positioning & shape
        "fixed bottom-6 right-6 z-40",
        "flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-full",
        // Elevated dark surface
        "bg-card border border-border/60 shadow-xl shadow-black/20",
        // Text
        "text-sm font-medium text-foreground",
        // Hover & interaction
        "hover:bg-accent hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10",
        "hover:scale-[1.03] active:scale-[0.97]",
        "transition-all duration-200 ease-out",
        // Hide when sidebar is open
        isOpen && "pointer-events-none opacity-0 translate-y-4",
      )}
    >
      <HugeiconsIcon icon={MessageSquare} className="w-5 h-5 text-primary" />
      <span>AI Chat</span>

      {/* Notification dot — shown when there are unread/new insights */}
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-card animate-pulse" />
    </button>
  );
}
