"use client";

import { X, Sparkles, ExternalLink } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { BiasIndicator } from "./BiasIndicator";
import { SentimentBadge } from "./SentimentBadge";
import { formatRelativeTime } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ArticleDetailModal() {
  const { selectedArticle, closeArticleDetail, openChat } = useAppStore();

  if (!selectedArticle) return null;

  return (
    <Dialog open={!!selectedArticle} onOpenChange={() => closeArticleDetail()}>
      <DialogContent className="max-w-[90vw] max-h-[80vh] bg-zinc-900 border-zinc-700 text-zinc-100 overflow-y-auto p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs font-bold text-zinc-500 uppercase">
              {selectedArticle.source}
            </span>
            <span className="text-[10px] text-zinc-600 font-mono">
              {formatRelativeTime(selectedArticle.publishedAt)}
            </span>
            <BiasIndicator biasCategory={selectedArticle.biasCategory} />
            <SentimentBadge score={selectedArticle.sentimentScore} />
          </div>
          <DialogTitle className="text-xl font-bold text-zinc-100 leading-tight">
            {selectedArticle.title}
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Content */}
          <p className="text-sm text-zinc-300 leading-relaxed">
            {selectedArticle.contentSnippet}
          </p>

          {/* Entities */}
          {selectedArticle.entities.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                Entities
              </h4>
              <div className="flex flex-wrap gap-1">
                {selectedArticle.entities.map((entity, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700"
                  >
                    {entity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis (placeholder — evaluating UX value) */}
          <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-300">
                  AI Analysis
                </span>
              </div>
              <button
                onClick={() => {
                  closeArticleDetail();
                  openChat(selectedArticle);
                }}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors text-xs font-medium"
              >
                <Sparkles className="w-3 h-3" />
                <span>Discuss with AI</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase">
                  Framing
                </span>
                <p className="text-xs text-zinc-300 mt-1">
                  {selectedArticle.biasNote || "Analysis pending..."}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase">
                  Perspective
                </span>
                <p className="text-xs text-zinc-300 mt-1">
                  {selectedArticle.perspectiveCountries.length > 0
                    ? selectedArticle.perspectiveCountries.join(", ")
                    : "Not analyzed"}
                </p>
              </div>
            </div>

            {/* Loaded Terms placeholder */}
            <div className="mt-3 pt-3 border-t border-purple-500/10">
              <span className="text-[10px] text-zinc-500 uppercase">
                Loaded Terms
              </span>
              <p className="text-[10px] text-zinc-600 mt-1 italic">
                Feature coming soon — AI will highlight emotionally charged
                language
              </p>
            </div>
          </div>

          {/* External Link */}
          <a
            href={selectedArticle.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Read original article</span>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
