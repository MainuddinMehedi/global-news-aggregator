"use client";

import { useState } from "react";
import { SkippedArticleData, FailedEnrichmentData, GazetteerConfig } from "@/queries/admin/skipped";
import SkippedArticlesTable from "./skipped/SkippedArticlesTable";
import GazetteerSandbox from "./skipped/GazetteerSandbox";
import FailedEnrichmentsTable from "./skipped/FailedEnrichmentsTable";

interface SkippedBacklogTabProps {
  skippedArticles: SkippedArticleData[];
  failedEnrichments: FailedEnrichmentData[];
  gazetteerConfig: GazetteerConfig;
}

export default function SkippedBacklogTab({
  skippedArticles,
  failedEnrichments,
  gazetteerConfig,
}: SkippedBacklogTabProps) {
  const [selectedArticle, setSelectedArticle] = useState<SkippedArticleData | undefined>(
    skippedArticles[0]
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header and overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Diagnostics & Gazetteer Sandbox</h2>
          <p className="text-muted-foreground text-xs mt-1 leading-normal">
            Analyze auto-skipped articles, tune gazetteer dictionary weights, and manage the failed enrichment backlog queue.
          </p>
        </div>
      </div>

      {/* Main Grid: Skipped Articles + Sandbox */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold tracking-tight uppercase text-muted-foreground">
            1. Dictionary Tuning Sandbox
          </h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 xl:col-span-4">
            <SkippedArticlesTable
              articles={skippedArticles}
              selectedArticleId={selectedArticle?.id}
              onSelectArticle={setSelectedArticle}
              gazetteerConfig={gazetteerConfig}
            />
          </div>
          <div className="lg:col-span-7 xl:col-span-8">
            <GazetteerSandbox
              selectedArticle={selectedArticle}
              gazetteerConfig={gazetteerConfig}
            />
          </div>
        </div>
      </div>

      {/* Failures Ingestions Management Section */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <h3 className="text-sm font-extrabold tracking-tight uppercase text-muted-foreground">
          2. Failed Ingestions Management
        </h3>
        <div>
          <FailedEnrichmentsTable articles={failedEnrichments} />
        </div>
      </div>
    </div>
  );
}
