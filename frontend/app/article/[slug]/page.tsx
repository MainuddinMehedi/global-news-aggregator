import { getArticleById } from "@/queries/articles";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ArticleDetailsSkeleton from "@/components/articles/ArticleSkeleton";
import { ArticleDetailView } from "@/components/articles/ArticleDetailView";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ArticleDetailsPage({ params }: PageProps) {
  return (
    <Suspense fallback={<ArticleDetailsSkeleton />}>
      <ArticleDetailsContent params={params} />
    </Suspense>
  );
}

async function ArticleDetailsContent({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleById(slug);

  if (!article) {
    notFound();
  }

  return <ArticleDetailView article={article} />;
}
