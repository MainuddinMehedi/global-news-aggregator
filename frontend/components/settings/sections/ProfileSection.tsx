"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSetLoginModalOpen } from "@/store";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircle02Icon } from "@hugeicons/core-free-icons";

export default function ProfileSection() {
  const { data: session, status } = useSession();
  const setLoginModalOpen = useSetLoginModalOpen();

  const getInitials = (name?: string | null, email?: string | null) => {
    const displayValue = name || email || "?";
    return displayValue.charAt(0).toUpperCase();
  };

  if (status === "loading") {
    return (
      <>
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-full bg-muted" />
          <div className="flex flex-col space-y-2">
            <div className="h-5 w-32 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted rounded" />
          </div>
        </div>
        <Separator />
      </>
    );
  }

  if (!session?.user) {
    return (
      <>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-left">
            <Avatar className="w-16 h-16 border border-border/80">
              <AvatarFallback className="bg-muted text-muted-foreground">
                <HugeiconsIcon icon={UserCircle02Icon} className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h3 className="text-xl font-bold">Guest User</h3>
              <p className="text-sm text-muted-foreground">Sign in to sync your preferences across devices</p>
            </div>
          </div>
          <Button size="sm" className="font-semibold shadow-md shrink-0 sm:ml-auto" onClick={() => setLoginModalOpen(true)}>
            Sign In
          </Button>
        </div>
        <Separator />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
            {getInitials(session.user.name, session.user.email)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <h3 className="text-xl font-bold">{session.user.name || "Anonymous User"}</h3>
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
        </div>
      </div>
      <Separator />
    </>
  );
}
