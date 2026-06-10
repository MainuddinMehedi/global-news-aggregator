"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Article } from "@/types/article";
import ArticleCard from "@/components/articles/ArticleCard";
import { TopicFinding } from "@/types/lockedTopic";
import { FindingCard } from "@/components/locked-topics/FindingCard";

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const [articles, setArticles] = useState<Article[]>([]);
  const [findings, setFindings] = useState<TopicFinding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookmarks() {
      if (status !== "authenticated") return;
      try {
        const res = await fetch(`/api/bookmarks/details`);
        if (res.ok) {
          const data = await res.json();
          setArticles(data.articles || []);
          setFindings(data.findings || []);
        }
      } catch (err) {
        console.error("Failed to fetch bookmarks", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (status === "authenticated") fetchBookmarks();
    if (status === "unauthenticated") setLoading(false);
  }, [status]);

  if (status === "loading" || loading) {
    return <div className="p-8 text-center animate-pulse">Loading bookmarks...</div>;
  }

  if (status === "unauthenticated") {
    return <div className="p-8 text-center">Please sign in to view your bookmarks.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 w-full">
      <h1 className="text-3xl font-bold mb-8">Bookmarks</h1>

      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="mb-6 bg-muted/50 w-full justify-start overflow-x-auto rounded-xl p-1">
          <TabsTrigger value="articles" className="rounded-lg">Articles ({articles.length})</TabsTrigger>
          <TabsTrigger value="findings" className="rounded-lg">Findings ({findings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          {articles.length === 0 ? (
            <Card className="border-dashed shadow-none p-12 text-center text-muted-foreground">
              No bookmarked articles found.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="findings">
          {findings.length === 0 ? (
            <Card className="border-dashed shadow-none p-12 text-center text-muted-foreground">
              No bookmarked findings found.
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {findings.map((finding) => (
                <FindingCard 
                  key={finding.id} 
                  finding={finding} 
                  onSelect={() => window.open(finding.sourceUrl, "_blank")} 
                  onDelete={() => {}} 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
