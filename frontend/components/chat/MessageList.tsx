"use client";

import { type UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { MemoMessageBubble } from "./MessageBubble";
import { hasRenderableMessageContent } from "@/lib/chat/messages";

interface MessageListProps {
  messages: UIMessage[];
  isLoading?: boolean;
  scrollAnchorId?: string;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 100) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }
    });
    return () => cancelAnimationFrame(timer);
  }, [messages]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto scrollbar-sleek">
      <div className="max-w-3xl mx-auto p-4 flex flex-col gap-6">
        {messages.map((msg, idx) => {
          const isLastMessage = idx === messages.length - 1;
          const isLastAndLoading =
            isLastMessage && Boolean(isLoading) && msg.role === "assistant";
          if (!hasRenderableMessageContent(msg, isLastAndLoading)) {
            return null;
          }
          return (
            <MemoMessageBubble
              key={msg.id}
              message={msg}
              isLastAndLoading={isLastAndLoading}
            />
          );
        })}
      </div>
    </div>
  );
}
