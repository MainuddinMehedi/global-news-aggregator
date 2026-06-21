"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { ContextItem } from "@/types/chat";

export function useChatContext(activeSessionId?: string) {
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [contextPickerOpen, setContextPickerOpen] = useState(false);

  const addContext = useCallback(() => {
    setContextPickerOpen(true);
  }, []);

  const handleAddContexts = useCallback(
    (newItems: ContextItem[]) => {
      let updatedContexts: ContextItem[] = [];
      setContexts((prev) => {
        const filtered = newItems.filter(
          (newItem) => !prev.some((existing) => existing.id === newItem.id),
        );
        if (filtered.length === 0) {
          updatedContexts = prev;
          return prev;
        }
        updatedContexts = [...prev, ...filtered];
        return updatedContexts;
      });

      if (activeSessionId && updatedContexts.length > 0) {
        fetch(`/api/chat/sessions/${activeSessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contexts: updatedContexts }),
        }).catch((error) => {
          console.error(error);
          toast.error("Failed to save context");
        });
      }
    },
    [activeSessionId],
  );

  const removeContext = useCallback(
    (id: string) => {
      let updatedContexts: ContextItem[] = [];
      setContexts((prev) => {
        updatedContexts = prev.filter((c) => c.id !== id);
        return updatedContexts;
      });

      if (activeSessionId) {
        fetch(`/api/chat/sessions/${activeSessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contexts: updatedContexts }),
        }).catch((error) => {
          console.error(error);
          toast.error("Failed to update contexts");
        });
      }
    },
    [activeSessionId],
  );

  return {
    contexts,
    setContexts,
    contextPickerOpen,
    setContextPickerOpen,
    addContext,
    handleAddContexts,
    removeContext,
  };
}
