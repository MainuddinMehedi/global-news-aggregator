import ChatInterface from "@/components/chat/ChatInterface";
import { Suspense } from "react";

export const metadata = {
  title: "AI Assistant | Global News Aggregator",
  description: "Chat with the AI assistant about global news and events.",
};

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col bg-background/95 overflow-hidden">
      <Suspense fallback={<div className="h-full w-full bg-background animate-pulse" />}>
        <ChatInterface />
      </Suspense>
    </div>
  );
}
