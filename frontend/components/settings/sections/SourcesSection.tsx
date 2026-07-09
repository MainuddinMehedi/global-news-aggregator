"use client";

import ManageSourcesModal from "@/components/settings/modals/ManageSourcesModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FeedSource } from "@news/db";
import { useState } from "react";

interface SourcesSectionProps {
  dbFeedSources: FeedSource[];
  dbDisabledBuiltinSources: string[];
}

export default function SourcesSection({
  dbFeedSources = [],
  dbDisabledBuiltinSources = [],
}: SourcesSectionProps) {
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Manage Sources</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable global curated news sources. You have{" "}
                {dbFeedSources.length} sources available.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsManageModalOpen(true)}
            >
              View & Modify
            </Button>
          </div>
        </CardContent>
      </Card>

      <ManageSourcesModal
        isOpen={isManageModalOpen}
        onOpenChange={setIsManageModalOpen}
        dbFeedSources={dbFeedSources}
        dbDisabledBuiltinSources={dbDisabledBuiltinSources}
      />
    </>
  );
}
