import { auth } from "@/auth";
import { EmptyState } from "@/components/ui/EmptyState";
import { Bookmark01Icon } from "@hugeicons/core-free-icons";
import BookmarksTabs from "@/components/bookmarks/BookmarksTabs";
import {
  getUserBookmarkedArticles,
  getUserBookmarkedFindings,
} from "@/queries/bookmarks";

export default async function BookmarksPage() {
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

  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-bold">Bookmarks</h1>
      <BookmarksTabs articles={articles} findings={findings} />
    </div>
  );
}
