"use client";

import { ArrowLeft } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ArticleBackButton() {
  const searchParams = useSearchParams();
  const storySlug = searchParams?.get("story");

  return (
    <Link
      href={storySlug ? `/stories/${storySlug}` : "/"}
      className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors group"
    >
      <HugeiconsIcon
        icon={ArrowLeft}
        className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-0.5"
      />
      {storySlug ? "Go Back to Story" : "Back to Feed"}
    </Link>
  );
}
