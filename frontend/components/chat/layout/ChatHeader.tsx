"use client";

import { useState } from "react";
import {
  Robot01Icon,
  PlusSignIcon,
  Time02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ChatHistoryPanel, { type ChatSessionListItem } from "@/components/chat/layout/ChatHistoryPanel";

interface ChatHeaderProps {
  activeSessionId?: string;
  sessions: ChatSessionListItem[];
  sessionsLoading: boolean;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

export default function ChatHeader({
  activeSessionId,
  sessions,
  sessionsLoading,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}: ChatHeaderProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleSelectSession = (id: string) => {
    onSelectSession(id);
    setHistoryOpen(false);
  };

  const handleNewChatClick = () => {
    onNewChat();
    setHistoryOpen(false);
  };

  return (
    <div className="absolute top-3 inset-x-0 z-20 flex justify-center pointer-events-none">
      <div className="w-full max-w-3xl flex items-center justify-between px-4 pointer-events-auto">
        {/* AI Analyst Badge */}
        <div className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-sm">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
            <HugeiconsIcon
              icon={Robot01Icon}
              className="w-3 h-3 text-primary"
            />
          </div>
          <span className="text-sm font-semibold leading-none">
            AI Analyst
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>

        {/* Action Buttons */}
        <div className="inline-flex items-center gap-0.5 h-9 px-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-sm">
          {activeSessionId && (
            <button
              onClick={handleNewChatClick}
              aria-label="New chat"
              className="p-1.5 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
            </button>
          )}

          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Chat history"
                className="p-1.5 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-colors"
              >
                <HugeiconsIcon icon={Time02Icon} className="w-4 h-4" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="p-0 w-full sm:max-w-md"
              showCloseButton={false}
            >
              <div className="sr-only">
                <SheetTitle>Chat History</SheetTitle>
                <SheetDescription>
                  Review your past AI chat sessions.
                </SheetDescription>
              </div>
              <ChatHistoryPanel
                sessions={sessions}
                activeSessionId={activeSessionId}
                loading={sessionsLoading}
                onSelectSession={handleSelectSession}
                onDeleteSession={onDeleteSession}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
