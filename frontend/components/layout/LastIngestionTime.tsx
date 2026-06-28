import prisma from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { TimeAgo } from "./TimeAgo";

async function getLatestIngestionTime() {
  "use cache";
  cacheTag("articles");
  cacheLife("minutes");
  
  const task = await prisma.systemTask.findFirst({
    where: { taskName: "rss-ingestion", status: "SUCCESS" },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true }
  });
  
  return task?.completedAt || null;
}

export default async function LastIngestionTime() {
  const completedAt = await getLatestIngestionTime();
  
  if (!completedAt) return null;
  
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
      <div className="w-1.5 h-1.5 rounded-full bg-green-500/80 animate-pulse" />
      <span>
        Updated <TimeAgo date={completedAt} />
      </span>
    </div>
  );
}
