import NavLinks from "./NavLinks";
import { Suspense } from "react";
import {
  getLockedTopicCount,
  getTotalMatchCount,
} from "@/queries/lockedTopics";
import { getArticleCount, getStoryCount } from "@/queries/counts";
import GlobalStatsFetcher from "./GlobalStatsFetcher";

export default async function Sidebar() {
  const [matchCount, topicCount, articleCount, storyCount] = await Promise.all([
    getTotalMatchCount(),
    getLockedTopicCount(),
    getArticleCount(),
    getStoryCount(),
  ]);

  return (
    <aside className="h-full w-full flex flex-col justify-between py-5 px-2 lg:px-3 bg-sidebar text-sidebar-foreground">
      <div>
        <GlobalStatsFetcher
          articleCount={articleCount}
          storyCount={storyCount}
          topicMatchCount={matchCount}
          lockedTopicCount={topicCount}
        />
        <Suspense
          fallback={
            <div className="h-32 w-full animate-pulse bg-muted rounded-xl" />
          }
        >
          <NavLinks />
        </Suspense>
      </div>

      {/*TODO: Implement user account information.*/}
      <div className="hidden lg:block text-sidebar-foreground/50 text-xs px-1">
        User logo
      </div>
    </aside>
  );
}
