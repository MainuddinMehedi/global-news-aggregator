"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { SidebarLeftIcon, UserCircle02Icon } from "@hugeicons/core-free-icons";
import { Suspense } from "react";
import NavLinks from "./NavLinks";
import GlobalStatsFetcher from "./GlobalStatsFetcher";
import { useIsSidebarCollapsed, useSetSidebarCollapsed } from "@/store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface SidebarContentProps {
  matchCount: number;
  topicCount: number;
  articleCount: number;
  storyCount: number;
}

export default function SidebarContent({
  matchCount,
  topicCount,
  articleCount,
  storyCount,
}: SidebarContentProps) {
  const [mounted, setMounted] = useState(false);
  const isCollapsed = useIsSidebarCollapsed();
  const setCollapsed = useSetSidebarCollapsed();
  const { data: session, status } = useSession();
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use a stable default (false) for the server and initial client render
  const effectiveCollapsed = mounted ? isCollapsed : false;

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !nameInput) {
      toast.error("Please fill in both name and email.");
      return;
    }
    
    setIsSending(true);
    try {
      const regRes = await fetch("/api/auth/pre-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, name: nameInput }),
      });
      
      if (!regRes.ok) {
        throw new Error("Pre-registration failed");
      }
      
      const res = await signIn("nodemailer", { email: emailInput, redirect: false });
      if (res?.error) {
        throw new Error(res.error);
      }
      toast.success("A sign-in link has been sent to your email address.");
      setEmailInput("");
      setNameInput("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send sign-in link. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
    const displayValue = name || email || "?";
    return displayValue.charAt(0).toUpperCase();
  };

  return (
    <aside
      className={cn(
        "h-full w-full flex flex-col justify-between py-5 px-2 bg-sidebar text-sidebar-foreground transition-all duration-300",
        effectiveCollapsed ? "items-center" : "items-start px-3",
      )}
    >
      <div className="w-full">
        <GlobalStatsFetcher
          articleCount={articleCount}
          storyCount={storyCount}
          topicMatchCount={matchCount}
          lockedTopicCount={topicCount}
        />
        <Suspense
          fallback={
            <div className="h-32 w-full animate-pulse bg-muted rounded-xl" />
          }
        >
          <NavLinks isManualCollapsed={effectiveCollapsed} />
        </Suspense>
      </div>

      <div className="w-full space-y-2">
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!isCollapsed)}
          className={cn(
            "w-full flex items-center gap-3 py-2.5 rounded-lg text-sm transition-all duration-200 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-3",
            effectiveCollapsed && "justify-center px-0",
          )}
        >
          <HugeiconsIcon
            icon={SidebarLeftIcon}
            className={cn(
              "shrink-0 w-5 h-5 transition-transform duration-300",
              effectiveCollapsed && "rotate-180",
            )}
          />
          {!effectiveCollapsed && <span>Collapse</span>}
        </button>

        {/* User Profile Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer w-full",
                effectiveCollapsed && "justify-center px-0",
              )}
            >
              <Avatar className="w-6 h-6">
                <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "User"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {session?.user ? getInitials(session.user.name, session.user.email) : <HugeiconsIcon icon={UserCircle02Icon} className="w-full h-full" />}
                </AvatarFallback>
              </Avatar>
              {!effectiveCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate text-sidebar-foreground">
                    {status === "loading" ? "Loading..." : session?.user ? session.user.name : "Sign In"}
                  </span>
                </div>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent side="right" align="end" className="w-85 p-5 border border-border/50 bg-popover text-popover-foreground shadow-2xl rounded-2xl">
            {status === "loading" ? (
              <p className="text-muted-foreground animate-pulse text-xs">Loading profile...</p>
            ) : session?.user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
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
                <div className="flex flex-col gap-2 pt-3 border-t border-border/50">
                  <Link href="/settings" className="w-full">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs font-semibold rounded-lg">
                      Account Settings
                    </Button>
                  </Link>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => signOut()}
                    className="w-full text-xs font-semibold rounded-lg"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-foreground">Sign In</h4>
                  <p className="text-xs text-muted-foreground">Sign in to save settings & bookmarks.</p>
                </div>
                <form onSubmit={handleMagicLinkSignIn} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-xs">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      required
                      className="h-8 text-xs rounded-lg bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      required
                      className="h-8 text-xs rounded-lg bg-background"
                    />
                  </div>
                  <Button type="submit" disabled={isSending} className="w-full h-8 text-xs font-semibold rounded-lg">
                    {isSending ? "Sending Link..." : "Send Magic Link"}
                  </Button>
                </form>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-popover px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-8 text-xs font-semibold rounded-lg" 
                  onClick={() => signIn("google")}
                >
                  Continue with Google
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </aside>
  );
}
