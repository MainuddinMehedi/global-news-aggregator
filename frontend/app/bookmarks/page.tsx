import { Suspense } from "react";
import { BookmarksContainer } from "@/components/bookmarks/BookmarksContainer";
import { BookmarksSkeleton } from "@/components/skeletons/bookmarks/BookmarksSkeleton";

export default function BookmarksPage() {
  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-bold">Bookmarks</h1>
      <Suspense fallback={<BookmarksSkeleton />}>
        <BookmarksContainer />
      </Suspense>
    </div>
  );
}
