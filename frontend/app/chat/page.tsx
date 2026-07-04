import ChatController from "@/components/chat/layout/ChatController";
import ChatInterface from "@/components/chat/layout/ChatInterface";
import { Suspense } from "react";

export const metadata = {
  title: "AI Assistant | Global News Aggregator",
  description: "Chat with the AI assistant about global news and events.",
};

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col bg-background/95 overflow-hidden">
      <Suspense fallback={<ChatInterface />}>
        <ChatController />
      </Suspense>
    </div>
  );
}
