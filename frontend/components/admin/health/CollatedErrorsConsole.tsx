"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface CollatedErrorsConsoleProps {
  recentErrors: { taskName: string; errorMessage: string; startedAt: Date }[];
}

export default function CollatedErrorsConsole({ recentErrors }: CollatedErrorsConsoleProps) {
  const [isErrorsExpanded, setIsErrorsExpanded] = useState(true);

  return (
    <Card className="bg-card/45 border-border/50 shadow-sm overflow-hidden">
      <div className="border-b border-border/50 px-5 py-4 bg-muted/20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive shrink-0 animate-pulse" />
          <h3 className="font-bold text-sm text-foreground">Collated Diagnostics Console</h3>
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setIsErrorsExpanded(!isErrorsExpanded)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {isErrorsExpanded ? "Hide" : "Show Logs"}
        </Button>
      </div>
      {isErrorsExpanded && (
        <CardContent className="p-0">
          <div className="bg-black/95 font-mono text-[11px] p-5 text-red-400 overflow-auto max-h-60 leading-relaxed">
            {recentErrors.length === 0 ? (
              <div className="text-emerald-400 flex flex-col space-y-1">
                <span>$ system-diagnostics --check</span>
                <span className="text-emerald-500 font-bold">[OK] No worker or scraper errors logged in database. System is completely healthy.</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-muted-foreground">$ tail -n 10 errors.log</div>
                {recentErrors.map((err, i) => (
                  <div key={i} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <span className="text-muted-foreground">
                      [{format(new Date(err.startedAt), "yyyy-MM-dd HH:mm:ss")}]
                    </span>{" "}
                    <span className="text-red-500 font-semibold uppercase">
                      [{err.taskName}]
                    </span>{" "}
                    <span className="text-red-300">{err.errorMessage}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
