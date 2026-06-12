"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Bookmark01Icon, Bookmark02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useSetLoginModalOpen } from "@/store";

interface BookmarkButtonProps {
  type: "article" | "finding";
  targetId: string;
  isBookmarkedInitial?: boolean;
}

export default function BookmarkButton({ type, targetId, isBookmarkedInitial = false }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(isBookmarkedInitial);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const setLoginModalOpen = useSetLoginModalOpen();

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      toast("Please sign in to bookmark items.", {
        action: {
          label: "Sign In",
          onClick: () => setLoginModalOpen(true),
        },
      });
      return;
    }

    setIsLoading(true);
    // Optimistic update
    const prev = isBookmarked;
    setIsBookmarked(!prev);

    try {
      const res = await fetch(`/api/bookmarks`, {
        method: prev ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, targetId }),
      });

      if (!res.ok) {
        throw new Error("Failed to update bookmark");
      }
      
      if (!prev) {
        toast.success(type === "article" ? "Article bookmarked" : "Finding bookmarked");
      }
    } catch (error) {
      setIsBookmarked(prev);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        isBookmarked 
          ? "text-primary hover:bg-primary/10" 
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        isLoading && "opacity-50 cursor-not-allowed"
      )}
      title={isBookmarked ? "Remove bookmark" : "Bookmark"}
    >
      <HugeiconsIcon 
        icon={isBookmarked ? Bookmark02Icon : Bookmark01Icon} 
        className={cn("w-4 h-4", isBookmarked && "fill-current")}
      />
    </button>
  );
}
