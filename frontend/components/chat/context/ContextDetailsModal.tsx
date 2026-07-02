"use client";

import { getArticleDetails, getStoryDetails } from "@/app/actions/details";
import { ArticleDetailView } from "@/components/articles/ArticleDetailView";
import { StoryDetailView } from "@/components/stories/StoryDetailView";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ContextItem } from "@/types/chat";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Suspense, use, useEffect, useState } from "react";

interface ContextDetailsModalProps {
  contextItem: ContextItem | null;
  onClose: () => void;
}

export function ContextDetailsModal({
  contextItem,
  onClose,
}: ContextDetailsModalProps) {
  const [detailsPromise, setDetailsPromise] = useState<Promise<any> | null>(
    null,
  );

  useEffect(() => {
    if (!contextItem) {
      setDetailsPromise(null);
      return;
    }

    if (contextItem.type === "article" || !contextItem.type) {
      setDetailsPromise(getArticleDetails(contextItem.id));
    } else if (contextItem.type === "story") {
      setDetailsPromise(getStoryDetails(contextItem.id));
    }
  }, [contextItem]);

  const isOpen = !!contextItem;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:w-[85vw] sm:max-w-[85vw] h-[90vh] p-0 overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50 scrollbar-sleek">
        <DialogTitle className="sr-only">
          {contextItem?.title || "Details"}
        </DialogTitle>

        <DialogDescription className="sr-only">
          Context details for {contextItem?.title}
        </DialogDescription>

        <div className="p-4 sm:p-6 lg:p-8 min-h-full">
          {detailsPromise && contextItem && (
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-muted-foreground space-y-4">
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="w-8 h-8 animate-spin text-primary"
                  />
                  <p className="text-sm font-medium">Loading details...</p>
                </div>
              }
            >
              <DetailsResolver
                promise={detailsPromise}
                type={contextItem.type}
                slug={contextItem.id}
              />
            </Suspense>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailsResolver({
  promise,
  type,
  slug,
}: {
  promise: Promise<any>;
  type?: "article" | "story" | string;
  slug: string;
}) {
  const data = use(promise);

  if (data?.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-destructive space-y-2">
        <p className="text-sm font-medium">{data.error}</p>
      </div>
    );
  }

  if (type === "story") {
    return (
      <StoryDetailView
        story={data.story}
        sources={data.sources}
        origins={data.origins}
        slug={slug}
        isModal={true}
      />
    );
  }

  return <ArticleDetailView article={data.article} isModal={true} />;
}
