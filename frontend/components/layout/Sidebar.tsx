import { auth } from "@/auth";
import {
  getLockedTopicCount,
  getTotalMatchCount,
} from "@/queries/lockedTopics";
import { getArticleCount, getStoryCount } from "@/queries/counts";
import SidebarContent from "./SidebarContent";

export default async function Sidebar() {
  const session = await auth();
  const userId = session?.user?.id;

  const [matchCount, topicCount, articleCount, storyCount] = await Promise.all([
    userId ? getTotalMatchCount(userId) : 0,
    userId ? getLockedTopicCount(userId) : 0,
    getArticleCount(),
    getStoryCount(),
  ]);

  return (
    <SidebarContent
      matchCount={matchCount}
      topicCount={topicCount}
      articleCount={articleCount}
      storyCount={storyCount}
    />
  );
}
