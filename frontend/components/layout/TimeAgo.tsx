"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

export function TimeAgo({ date }: { date: Date }) {
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    const updateTime = () => setTimeAgo(formatDistanceToNow(new Date(date), { addSuffix: true }));
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [date]);

  if (!timeAgo) return <span>just now</span>;

  return <span>{timeAgo}</span>;
}
