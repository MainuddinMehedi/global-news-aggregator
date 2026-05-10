// Server component — no state, no hooks.
import { HugeiconsIcon } from "@hugeicons/react";
import { Robot01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { Message } from "./types";

interface MessageListProps {
  messages: Message[];
  /** Ref forwarded to the scroll anchor — must be passed from the parent client component */
  scrollAnchorId?: string;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 max-w-[85%]",
        isUser ? "self-end flex-row-reverse" : "self-start",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex shrink-0 items-center justify-center mt-1 shadow-sm",
          isUser ? "bg-muted" : "bg-primary/10 border border-primary/20",
        )}
      >
        {isUser ? (
          <HugeiconsIcon
            icon={UserIcon}
            className="w-5 h-5 text-muted-foreground"
          />
        ) : (
          <HugeiconsIcon icon={Robot01Icon} className="w-5 h-5 text-primary" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted/50 border border-border/50 text-foreground rounded-tl-sm",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

/**
 * Pure display list — renders messages.
 * The scroll anchor `div#chat-scroll-anchor` is rendered here so the parent
 * client component can call `document.getElementById("chat-scroll-anchor")
 * ?.scrollIntoView()` without needing a ref on this server component.
 */
export default function MessageList({ messages }: MessageListProps) {
  return (
    <div className="h-full overflow-y-auto p-4 flex flex-col gap-5">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {/* Scroll anchor — targeted by the parent via getElementById */}
      <div id="chat-scroll-anchor" aria-hidden="true" />
    </div>
  );
}
