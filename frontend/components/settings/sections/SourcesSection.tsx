"use client";

import ManageSourcesModal from "@/components/settings/modals/ManageSourcesModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface SourcesSectionProps {
  dbSettings: any;
  dbFeedSources: any[];
}

export default function SourcesSection({
  dbSettings,
  dbFeedSources,
}: SourcesSectionProps) {
  const dbDisabledBuiltinSources = dbSettings.disabledBuiltinSources || [];
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  return (
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

          <>
            <Button
              variant="outline"
              onClick={() => setIsManageModalOpen(true)}
            >
              View & Modify
            </Button>

            <ManageSourcesModal
              isOpen={isManageModalOpen}
              onOpenChange={setIsManageModalOpen}
              dbFeedSources={dbFeedSources}
              dbDisabledBuiltinSources={dbDisabledBuiltinSources}
            />
          </>
        </div>
      </CardContent>
    </Card>
  );
}
