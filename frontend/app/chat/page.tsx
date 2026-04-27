"use client";

import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4 lg:p-6">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
        <ChatInterface className="h-full" />
      </div>

      {/* Context Sidebar */}
      <div className="w-64 hidden xl:flex flex-col space-y-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Chat Tips
          </h3>
          <div className="space-y-3 text-xs text-zinc-500">
            <p>Try asking:</p>
            <ul className="space-y-2">
              <li className="p-2 bg-zinc-800/50 rounded border border-zinc-700 text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors">
                &ldquo;Compare Al Jazeera and BBC coverage of the ceasefire&rdquo;
              </li>
              <li className="p-2 bg-zinc-800/50 rounded border border-zinc-700 text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors">
                &ldquo;What&apos;s the sentiment trend on Bangladesh articles?&rdquo;
              </li>
              <li className="p-2 bg-zinc-800/50 rounded border border-zinc-700 text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors">
                &ldquo;Find articles about Iran from Eastern sources&rdquo;
              </li>
            </ul>
          </div>
        </div>

        {/* Quota info */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Usage
          </h3>
          <div className="text-xs text-zinc-500 space-y-1">
            <p>
              💡 <span className="text-zinc-400">Save quota:</span> Be specific — &ldquo;Summarize top 3 US articles on Iran&rdquo; uses fewer tokens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
