"use client";

import type { ComponentProps } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSetLoginModalOpen } from "@/store";

type Hugeicon = ComponentProps<typeof HugeiconsIcon>["icon"];

interface SignInPromptCardProps {
  icon: Hugeicon;
  title: string;
  description: string;
}

export function SignInPromptCard({ icon, title, description }: SignInPromptCardProps) {
  const setLoginModalOpen = useSetLoginModalOpen();

  return (
    <Card className="bg-card/45 border-border/50 shadow-sm overflow-hidden">
      <CardContent className="p-6 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
          <HugeiconsIcon icon={icon} className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold">{title}</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {description}
          </p>
        </div>
        <Button size="sm" className="font-semibold shadow-md" onClick={() => setLoginModalOpen(true)}>
          Sign In
        </Button>
      </CardContent>
    </Card>
  );
}
