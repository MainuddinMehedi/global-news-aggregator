"use client";

import { useState, useEffect, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Cancel01Icon,
  File01Icon,
  MessageSquare,
  Sparkles,
  Add01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ContextItem } from "@/types/chat";
import { contextFromArticle } from "@/lib/chat/contexts";
import type { Article } from "@/types/article";
import type { Story } from "@/types/story";

interface ContextPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (items: ContextItem[]) => void;
  existingItems: ContextItem[];
}

export default function ContextPickerModal({
  isOpen,
  onClose,
  onAdd,
  existingItems,
}: ContextPickerModalProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"articles" | "stories">(
    "articles",
  );
  const [articles, setArticles] = useState<Article[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<ContextItem[]>([]);

  const fetchArticles = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/articles?search=${encodeURIComponent(query)}&limit=10`,
      );
      if (!res.ok) throw new Error("Failed to fetch articles");
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stories");
      if (!res.ok) throw new Error("Failed to fetch stories");
      const data = await res.json();
      setStories(data.stories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Consolidated data fetching
  useEffect(() => {
    if (!isOpen) return;

    if (activeTab === "stories") {
      if (stories.length === 0) {
        // Use a small delay to avoid synchronous state update during render
        const timer = setTimeout(() => {
          fetchStories();
        }, 0);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Debounced search for articles
    const delay = search ? 400 : 0;
    const timer = setTimeout(() => {
      fetchArticles(search);
    }, delay);

    return () => clearTimeout(timer);
  }, [isOpen, activeTab, search, stories.length, fetchArticles, fetchStories]);

  const toggleSelection = (item: ContextItem) => {
    setSelectedItems((prev) => {
      const isSelected = prev.some((i) => i.id === item.id);
      if (isSelected) {
        return prev.filter((i) => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleConfirm = () => {
    onAdd(selectedItems);
    setSelectedItems([]);
    onClose();
  };

  const isAlreadyAdded = (id: string) => existingItems.some((i) => i.id === id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] w-[95vw] h-[85vh] sm:h-[80vh] max-h-[850px] p-0 flex flex-col overflow-hidden gap-0 rounded-2xl border-border/60 shadow-2xl">
        <DialogHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border/50 shrink-0">
          <DialogTitle className="flex items-center gap-2 sm:gap-2.5 text-base sm:text-lg">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <HugeiconsIcon icon={Sparkles} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </div>
            <span>Add Analysis Context</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Search and select articles or story clusters to add to your current
            chat context for deeper analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="px-3 sm:px-6 py-3 sm:py-4 bg-muted/20 shrink-0">
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles, stories, or trends..."
              className="pl-8 sm:pl-9 h-9 sm:h-11 text-xs sm:text-sm bg-background border-border/60 focus:ring-primary/20 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-1 mt-3 sm:mt-4">
            <button
              onClick={() => setActiveTab("articles")}
              className={cn(
                "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all",
                activeTab === "articles"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              Articles
            </button>
            <button
              onClick={() => setActiveTab("stories")}
              className={cn(
                "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all",
                activeTab === "stories"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              Stories
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-[200px] px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Searching...
            </div>
          ) : activeTab === "articles" ? (
            <div className="flex flex-col gap-1">
              {articles.map((article) => {
                const context = contextFromArticle(article);
                const isSelected = selectedItems.some(
                  (i) => i.id === context.id,
                );
                const isAdded = isAlreadyAdded(context.id);

                return (
                  <button
                    key={article.id}
                    onClick={() => !isAdded && toggleSelection(context)}
                    disabled={isAdded}
                    className={cn(
                      "flex items-start gap-2.5 sm:gap-3 p-2 sm:p-3 rounded-xl text-left transition-all",
                      isSelected
                        ? "bg-primary/10 border-primary/20"
                        : "hover:bg-muted/50",
                      isAdded && "opacity-50 cursor-default",
                    )}
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-muted flex shrink-0 items-center justify-center mt-0.5">
                      <HugeiconsIcon
                        icon={File01Icon}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-foreground leading-snug line-clamp-2">
                        {article.title}
                      </p>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          {article.source}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                          •
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 pt-1">
                      {isAdded ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 h-5"
                        >
                          Added
                        </Badge>
                      ) : isSelected ? (
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          className="w-5 h-5 text-primary"
                        />
                      ) : (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-border flex items-center justify-center">
                          <HugeiconsIcon
                            icon={Add01Icon}
                            className="w-3 h-3 text-muted-foreground"
                          />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
              {articles.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No articles found.
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {stories
                .filter(
                  (story) =>
                    story.title.toLowerCase().includes(search.toLowerCase()) ||
                    story.summary.toLowerCase().includes(search.toLowerCase()),
                )
                .map((story) => {
                  const context: ContextItem = {
                    id: story.id,
                    title: story.title,
                    type: "story",
                    snapshot: {
                      summary: story.summary,
                      articleCount: story.articleCount,
                      impact: story.impact,
                    },
                  };
                  const isSelected = selectedItems.some(
                    (i) => i.id === context.id,
                  );
                  const isAdded = isAlreadyAdded(context.id);

                  return (
                    <button
                      key={story.id}
                      onClick={() => !isAdded && toggleSelection(context)}
                      disabled={isAdded}
                      className={cn(
                        "flex items-start gap-2.5 sm:gap-3 p-2 sm:p-3 rounded-xl text-left transition-all",
                        isSelected
                          ? "bg-primary/10 border-primary/20"
                          : "hover:bg-muted/50",
                        isAdded && "opacity-50 cursor-default",
                      )}
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex shrink-0 items-center justify-center mt-0.5">
                        <HugeiconsIcon
                          icon={MessageSquare}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-foreground leading-snug line-clamp-2">
                          {story.title}
                        </p>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-bold tracking-wider">
                            {story.articleCount} ARTICLES
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                            •
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase">
                            {story.impact || "Neutral"} IMPACT
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 pt-1">
                        {isAdded ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 h-5"
                          >
                            Added
                          </Badge>
                        ) : isSelected ? (
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            className="w-5 h-5 text-primary"
                          />
                        ) : (
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-border flex items-center justify-center">
                            <HugeiconsIcon
                              icon={Add01Icon}
                              className="w-3 h-3 text-muted-foreground"
                            />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              {stories.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No story clusters found.
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 sm:p-4 border-t border-border/50 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] sm:text-xs text-muted-foreground text-center sm:text-left">
            {selectedItems.length > 0 ? (
              <span className="text-primary font-medium">
                {selectedItems.length} items selected
              </span>
            ) : (
              "Select items to add to analysis"
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedItems.length === 0}
              className="flex-1 sm:flex-none px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none transition-all"
            >
              Add to Context
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
