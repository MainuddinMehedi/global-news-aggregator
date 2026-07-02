import { getArticleById } from "@/queries/articles";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ArticleDetailsSkeleton from "@/components/articles/ArticleSkeleton";
import { ArticleDetailView } from "@/components/articles/ArticleDetailView";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function ArticleDetailsPage({
  params,
  searchParams,
}: PageProps) {
  return (
    <Suspense fallback={<ArticleDetailsSkeleton />}>
      <ArticleDetailsContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ArticleDetailsContent({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const storySlug =
    typeof resolvedSearchParams.story === "string"
      ? resolvedSearchParams.story
      : undefined;
  const article = await getArticleById(slug);

  if (!article) {
    notFound();
  }

  return <ArticleDetailView article={article} storySlug={storySlug} />;
}
