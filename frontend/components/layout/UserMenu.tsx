"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircle02Icon, Login01Icon, UserSettings01Icon } from "@hugeicons/core-free-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSetLoginModalOpen } from "@/store";

interface UserMenuProps {
  effectiveCollapsed: boolean;
}

export default function UserMenu({ effectiveCollapsed }: UserMenuProps) {
  const { data: session, status } = useSession();
  const setLoginModalOpen = useSetLoginModalOpen();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
    const displayValue = name || email || "?";
    return displayValue.charAt(0).toUpperCase();
  };

  if (status === "loading") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 w-full animate-pulse",
          effectiveCollapsed && "justify-center px-0",
        )}
      >
        <div className="w-6 h-6 rounded-full bg-muted" />
        {!effectiveCollapsed && (
          <div className="flex flex-col min-w-0 flex-1 gap-1">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        )}
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className={cn("px-2 py-2 w-full", effectiveCollapsed && "px-0 flex justify-center")}>
        {effectiveCollapsed ? (
          <button onClick={() => setLoginModalOpen(true)} className="flex items-center justify-center p-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full">
            <HugeiconsIcon icon={Login01Icon} className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-sidebar-accent/50 border border-sidebar-accent">
            <span className="text-xs text-sidebar-foreground/80 font-medium">Log in to save settings & bookmarks</span>
            <Button onClick={() => setLoginModalOpen(true)} size="sm" variant="secondary" className="w-full text-xs font-semibold h-8 flex items-center gap-2">
              <HugeiconsIcon icon={Login01Icon} className="w-4 h-4" />
              Sign In
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer w-full",
            effectiveCollapsed && "justify-center px-0",
          )}
        >
          <Avatar className="w-6 h-6">
            <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {getInitials(session.user.name, session.user.email)}
            </AvatarFallback>
          </Avatar>
          {!effectiveCollapsed && (
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-sm font-semibold truncate text-sidebar-foreground">
                {session.user.name || "User"}
              </span>
              <span className="text-[11px] text-sidebar-foreground/50 truncate">
                {session.user.email}
              </span>
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent side="right" align="end" className="w-64 p-4 border border-border/50 bg-popover text-popover-foreground shadow-2xl rounded-xl">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                {getInitials(session.user.name, session.user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate text-foreground">
                {session.user.name || "User"}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {session.user.email}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5 pt-3 border-t border-border/50">
            {session.user.role === "ADMIN" && (
              <Link href="/admin" className="w-full" onClick={() => setIsPopoverOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs font-medium rounded-lg text-primary hover:text-primary hover:bg-primary/10">
                  <HugeiconsIcon icon={UserSettings01Icon} className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </Button>
              </Link>
            )}
            <Link href="/settings" className="w-full" onClick={() => setIsPopoverOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs font-medium rounded-lg">
                Account Settings
              </Button>
            </Link>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => {
                setIsPopoverOpen(false);
                signOut();
              }}
              className="w-full text-xs font-semibold rounded-lg mt-1"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
