import { auth } from "@/auth";
import BookmarksTabs from "@/components/bookmarks/BookmarksTabs";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getUserBookmarkedArticles,
  getUserBookmarkedFindings,
} from "@/queries/bookmarks";
import { Bookmark01Icon } from "@hugeicons/core-free-icons";

export async function BookmarksContainer() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <EmptyState
        icon={Bookmark01Icon}
        title="Sign in to add bookmarks"
        description="Save important articles and key concept findings to access them later. Your bookmarked items will be synchronized across your devices."
        authRequired={true}
        signInText="Sign in to add bookmarks"
        className="min-h-[60vh] border-none max-w-md bg-transparent mx-auto mt-5"
      />
    );
  }

  // Fetch bookmarks directly from the database on the server
  const [articles, findings] = await Promise.all([
    getUserBookmarkedArticles(session.user.id),
    getUserBookmarkedFindings(session.user.id),
  ]);

  return <BookmarksTabs articles={articles} findings={findings} />;
}
