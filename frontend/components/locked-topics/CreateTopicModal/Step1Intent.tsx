"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CreateTopicData } from "@/types/lockedTopic";

interface Step1Props {
  data: CreateTopicData;
  setData: (data: CreateTopicData) => void;
  onNext: () => void;
}

export default function Step1Intent({ data, setData, onNext }: Step1Props) {
  const isValid = data.displayName.trim() && data.userContext.trim();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="displayName"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70"
          >
            Display Name
          </Label>
          <Input
            id="displayName"
            placeholder="e.g. iran-israel, google-jobs"
            value={data.displayName}
            onChange={(e) => setData({ ...data, displayName: e.target.value })}
            className="rounded-xl border-secondary bg-secondary/30 focus-visible:ring-primary/20 h-12"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="userContext"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70"
          >
            What do you want to track?
          </Label>
          <Textarea
            id="userContext"
            placeholder="I want to track whether Google is posting any new AI or ML engineering roles, specifically in their DeepMind or Search divisions..."
            value={data.userContext}
            onChange={(e) => setData({ ...data, userContext: e.target.value })}
            className="min-h-[160px] rounded-xl border-secondary bg-secondary/30 focus-visible:ring-primary/20 resize-none leading-relaxed p-4"
          />
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            Describe your intent in detail. Our AI will analyze this to generate
            optimized search queries and identify relevant sources.
          </p>
        </div>
      </div>

      <Button
        disabled={!isValid}
        onClick={onNext}
        className="w-full rounded-xl py-7 font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
      >
        Continue to Sources
      </Button>
    </div>
  );
}
