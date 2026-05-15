import {
  getLockedTopicCount,
  getTotalMatchCount,
} from "@/queries/lockedTopics";
import { getArticleCount, getStoryCount } from "@/queries/counts";
import SidebarContent from "./SidebarContent";

export default async function Sidebar() {
  const [matchCount, topicCount, articleCount, storyCount] = await Promise.all([
    getTotalMatchCount(),
    getLockedTopicCount(),
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
