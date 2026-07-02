"use client";

import ChatHistoryPanel, {
  type ChatSessionListItem,
} from "@/components/chat/layout/ChatHistoryPanel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Alert02Icon,
  PlusSignIcon,
  Robot01Icon,
  Time02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

const GUEST_MESSAGE =
  "Guest Session: Limited to Mistral 8B model and 10 messages per chat.";

interface ChatHeaderProps {
  activeSessionId?: string;
  sessions: ChatSessionListItem[];
  sessionsLoading: boolean;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  isGuest?: boolean;
  onLoginClick?: () => void;
}

export default function ChatHeader({
  activeSessionId,
  sessions,
  sessionsLoading,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  isGuest,
  onLoginClick,
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
      <div className="w-full max-w-3xl flex items-center justify-between pointer-events-auto px-4">
        {/* AI Analyst Badge */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 h-8 sm:h-9 px-2.5 sm:px-3 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-sm">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary/20 flex items-center justify-center">
            <HugeiconsIcon
              icon={Robot01Icon}
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary"
            />
          </div>
          <span className="text-[11px] sm:text-sm font-semibold leading-none">
            AI Analyst
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>

        {/* Desktop Banner (Center) */}
        {isGuest && (
          <div className="hidden md:flex h-9 bg-warning/10 border border-warning/20 text-warning text-xs px-3 rounded-full backdrop-blur-md items-center gap-1.5 shadow-sm pointer-events-auto">
            <HugeiconsIcon
              icon={Alert02Icon}
              className="w-3.5 h-3.5 shrink-0"
            />
            <span className="whitespace-nowrap">{GUEST_MESSAGE}</span>
            <button
              onClick={onLoginClick}
              className="underline hover:text-warning/80 ml-1 font-medium whitespace-nowrap"
            >
              Sign in
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Popover (Right) */}
          {isGuest && (
            <div className="md:hidden">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex h-8 bg-warning/10 border border-warning/20 text-warning text-[11px] px-2.5 rounded-full backdrop-blur-md items-center gap-1 shadow-sm cursor-pointer pointer-events-auto">
                    <HugeiconsIcon
                      icon={Alert02Icon}
                      className="w-3 h-3 shrink-0"
                    />
                    <span className="font-semibold leading-none">
                      Guest Session
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="end"
                  className="w-[340px] p-2 px-3 rounded-xl bg-card border border-border/60 shadow-lg"
                >
                  <div className="flex items-center gap-2.5">
                    <p className="text-[12px] sm:text-xs text-muted-foreground flex-1 leading-tight">
                      {GUEST_MESSAGE}
                    </p>
                    <button
                      onClick={onLoginClick}
                      className="shrink-0 bg-warning/10 text-warning hover:bg-warning/20 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-colors"
                    >
                      Sign in
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Action Buttons */}
          <div className="inline-flex items-center gap-0.5 h-8 sm:h-9 px-1 sm:px-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-sm">
            {activeSessionId && (
              <button
                onClick={handleNewChatClick}
                aria-label="New chat"
                className="p-1 sm:p-1.5 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-colors"
              >
                <HugeiconsIcon
                  icon={PlusSignIcon}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                />
              </button>
            )}

            <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Chat history"
                  className="p-1 sm:p-1.5 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HugeiconsIcon
                    icon={Time02Icon}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  />
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
    </div>
  );
}
