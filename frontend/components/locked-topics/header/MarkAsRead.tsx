"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function MarkAsRead({ topicId }: { topicId: string }) {
  const router = useRouter();

  useEffect(() => {
    const markRead = async () => {
      try {
        const res = await fetch(`/api/locked-topics/${topicId}/read`, {
          method: "POST",
        });
        if (res.ok) {
          // We don't necessarily want to refresh immediately as it might
          // pull the rug out from under the user's "New" badges while they are looking.
          // But we want the *next* navigation/load to reflect it.
          // router.refresh() here might be too aggressive.
          // Let's just let the state persist for this session.
        }
      } catch (err) {
        console.error("Failed to mark findings as read on page view:", err);
      }
    };

    markRead();
  }, [topicId]);

  return null;
}
