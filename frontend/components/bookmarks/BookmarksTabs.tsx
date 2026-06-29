"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Article } from "@/types/article";
import ArticleCard from "@/components/articles/ArticleCard";
import { TopicFinding } from "@/types/lockedTopic";
import { FindingCard } from "@/components/locked-topics/findings/FindingCard";
import { FindingDetailsModal } from "@/components/locked-topics/findings/FindingDetailsModal";

export default function BookmarksTabs({
  articles,
  findings,
}: {
  articles: Article[];
  findings: TopicFinding[];
}) {
  const [selectedFinding, setSelectedFinding] = useState<TopicFinding | null>(null);

  return (
    <Tabs defaultValue="articles" className="w-full">
      <TabsList className="mb-6 bg-muted/50 w-full justify-start overflow-x-auto rounded-xl p-1">
        <TabsTrigger value="articles" className="rounded-lg">
          Articles ({articles.length})
        </TabsTrigger>
        <TabsTrigger value="findings" className="rounded-lg">
          Findings ({findings.length})
        </TabsTrigger>
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
                onDelete={() => {}}
                onSelect={setSelectedFinding}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <FindingDetailsModal
        finding={selectedFinding}
        open={!!selectedFinding}
        onOpenChange={(open) => {
          if (!open) setSelectedFinding(null);
        }}
        onDelete={async () => {
          if (selectedFinding) {
            setSelectedFinding(null);
          }
        }}
      />
    </Tabs>
  );
}
