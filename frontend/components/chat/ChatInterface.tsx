"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Loader2 } from "lucide-react";
import { useRef, useEffect, useState, useMemo, type FormEvent } from "react";
import type { Article } from "@/lib/utils";

interface ChatInterfaceProps {
  articleContext?: Article | null;
  className?: string;
}

export function ChatInterface({
  articleContext,
  className,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  // Build transport with article context in body
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: articleContext
          ? {
              articleContext: {
                title: articleContext.title,
                source: articleContext.source,
                biasCategory: articleContext.biasCategory,
                biasNote: articleContext.biasNote,
                sentimentScore: articleContext.sentimentScore,
                categories: articleContext.categories.map((c) => c.name),
                entities: articleContext.entities,
                contentSnippet: articleContext.contentSnippet,
                perspectiveCountries: articleContext.perspectiveCountries,
              },
            }
          : undefined,
      }),
    [articleContext]
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
    messages: articleContext
      ? [
          {
            id: "system-intro",
            role: "assistant" as const,
            content: `I'm ready to analyze "${articleContext.title}" from ${articleContext.source}. This article has a ${articleContext.biasCategory || "unclassified"} bias perspective${articleContext.sentimentScore != null ? ` with a sentiment score of ${articleContext.sentimentScore.toFixed(2)}` : ""}. What would you like to know?`,
            parts: [
              {
                type: "text" as const,
                text: `I'm ready to analyze "${articleContext.title}" from ${articleContext.source}. This article has a ${articleContext.biasCategory || "unclassified"} bias perspective${articleContext.sentimentScore != null ? ` with a sentiment score of ${articleContext.sentimentScore.toFixed(2)}` : ""}. What would you like to know?`,
              },
            ],
          },
        ]
      : [
          {
            id: "system-intro",
            role: "assistant" as const,
            content:
              "Hello! I'm your geopolitical news analyst. I can search articles, compare perspectives, and help you understand bias patterns. What would you like to explore?",
            parts: [
              {
                type: "text" as const,
                text: "Hello! I'm your geopolitical news analyst. I can search articles, compare perspectives, and help you understand bias patterns. What would you like to explore?",
              },
            ],
          },
        ],
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  }

  // Extract text from message parts or content
  function getMessageText(msg: (typeof messages)[0]): string {
    if (msg.content) return msg.content;
    return (
      msg.parts
        ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("") || ""
    );
  }

  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      {/* Header */}
      <div className="p-3 border-b border-border bg-zinc-900/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-zinc-200">AI Analyst</span>
        </div>
        {articleContext && (
          <span className="text-[10px] text-zinc-600 font-mono truncate max-w-[180px]">
            Context: {articleContext.source}
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
      >
        {messages.map((msg) => {
          const role = msg.role as string;
          const isUser = role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                isUser ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  isUser
                    ? "bg-blue-600 text-white"
                    : "bg-purple-600 text-white"
                }`}
              >
                {isUser ? "U" : "AI"}
              </div>
              <div
                className={`max-w-[85%] rounded-xl p-3 text-sm ${
                  isUser
                    ? "bg-blue-600/10 text-blue-100 border border-blue-500/20"
                    : "bg-zinc-800 text-zinc-200 border border-zinc-700"
                }`}
              >
                <p className="whitespace-pre-wrap">{getMessageText(msg)}</p>
              </div>
            </div>
          );
        })}
        {isLoading && (messages[messages.length - 1]?.role as string) !== "assistant" && (
          <div className="flex items-start space-x-3">
            <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
              AI
            </div>
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            </div>
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
            {error.message || "Something went wrong. Please try again."}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-zinc-900/30">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            placeholder={
              articleContext
                ? `Ask about "${articleContext.title.substring(0, 40)}..."`
                : "Ask about the news..."
            }
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-2.5 pl-4 pr-12 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-md transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
