"use client";

import { useSearchParams } from "next/navigation";
import ChatInterface from "./ChatInterface";

export default function ChatController() {
  const searchParams = useSearchParams();
  const activeSessionId = searchParams.get("session") ?? undefined;

  return <ChatInterface activeSessionId={activeSessionId} />;
}
