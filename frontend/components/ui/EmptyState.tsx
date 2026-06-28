"use client";

import type { ComponentProps, ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSetLoginModalOpen } from "@/store";
import { Button } from "@/components/ui/button";

type Hugeicon = ComponentProps<typeof HugeiconsIcon>["icon"];

interface EmptyStateProps {
  icon: Hugeicon;
  title: string;
  description: string;
  action?: ReactNode;
  authRequired?: boolean;
  signInText?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  authRequired,
  signInText = "Sign In",
  className = "",
}: EmptyStateProps) {
  const setLoginModalOpen = useSetLoginModalOpen();

  return (
    <div
      className={`flex flex-col items-center justify-center flex-1 py-16 px-6 text-center rounded-2xl bg-muted/10 border border-dashed ${className}`}
    >
      <div className="max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-muted flex items-center justify-center shadow-inner">
          <HugeiconsIcon
            icon={icon}
            className="w-10 h-10 text-muted-foreground"
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground leading-relaxed text-sm">
            {description}
          </p>
        </div>

        {(action || authRequired) && (
          <div className="pt-2">
            {authRequired ? (
              <Button
                size="lg"
                onClick={() => setLoginModalOpen(true)}
                className="gap-2 rounded-full px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
              >
                {signInText}
              </Button>
            ) : (
              action
            )}
          </div>
        )}
      </div>
    </div>
  );
}
