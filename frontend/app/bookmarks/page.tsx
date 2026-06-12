"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Article } from "@/types/article";
import ArticleCard from "@/components/articles/ArticleCard";
import { TopicFinding } from "@/types/lockedTopic";
import { FindingCard } from "@/components/locked-topics/FindingCard";
import { Bookmark01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

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
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] bg-background px-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="mx-auto w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading bookmarks...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] bg-background px-6 text-center">
        <div className="max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-2xl bg-muted flex items-center justify-center shadow-inner">
            <HugeiconsIcon
              icon={Bookmark01Icon}
              className="w-10 h-10 text-muted-foreground"
            />
          </div>

          {/* Text Content */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Sign in to view bookmarks</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Save important articles and key concept findings to access them later. Your bookmarked items will be synchronized across your devices.
            </p>
          </div>

          {/* Action */}
          <div className="pt-2">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl px-6 py-3 shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0"
            >
              Go to Settings to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
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
