"use client";

import { useAppStore } from "@/lib/store";
import { ChatInterface } from "./ChatInterface";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Sparkles } from "lucide-react";

export function ChatSlideOver() {
  const { chatOpen, closeChat, chatArticleContext } = useAppStore();

  return (
    <Sheet open={chatOpen} onOpenChange={(open) => !open && closeChat()}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[440px] p-0 bg-card border-l border-border flex flex-col"
      >
        <SheetHeader className="p-4 border-b border-border bg-zinc-900/50">
          <SheetTitle className="flex items-center space-x-2 text-zinc-200">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium">AI Analysis</span>
          </SheetTitle>
          {chatArticleContext && (
            <p className="text-[10px] text-zinc-500 truncate mt-1">
              Analyzing: {chatArticleContext.title}
            </p>
          )}
        </SheetHeader>
        <div className="flex-1 min-h-0">
          <ChatInterface
            articleContext={chatArticleContext}
            className="h-full"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
