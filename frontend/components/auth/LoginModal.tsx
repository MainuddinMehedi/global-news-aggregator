"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Globe } from "@hugeicons/core-free-icons";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsLoginModalOpen, useSetLoginModalOpen } from "@/store";

export default function LoginModal() {
  const isOpen = useIsLoginModalOpen();
  const setIsOpen = useSetLoginModalOpen();
  const pathname = usePathname();

  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [isSending, setIsSending] = useState(false);

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
      
      const res = await signIn("nodemailer", { 
        email: emailInput, 
        callbackUrl: pathname,
        redirect: false 
      });

      if (res?.error) {
        throw new Error(res.error);
      }
      toast.success("A sign-in link has been sent to your email address.");
      setEmailInput("");
      setNameInput("");
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to send sign-in link. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/50">
        <div className="p-8 pb-6 bg-card">
          <DialogHeader className="space-y-4 text-center items-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg mx-auto">
              <HugeiconsIcon icon={Globe} className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight">Welcome to GlobalAgg</DialogTitle>
              <DialogDescription className="mt-2 text-sm">
                Sign in or create an account to save bookmarks and customize your feed.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            <div className="space-y-3">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full font-semibold flex items-center justify-center gap-3 py-6 relative border-2 hover:bg-accent/50 transition-all" 
                onClick={() => signIn("google", { callbackUrl: pathname })}
              >
                <div className="absolute left-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <span className="text-base">Continue with Google</span>
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                <span className="font-semibold text-primary">Recommended</span> for a seamless and secure experience.
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-medium">Or use email magic link</span>
              </div>
            </div>

            <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  required
                  className="bg-background h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  className="bg-background h-10"
                />
              </div>
              <Button type="submit" disabled={isSending} variant="secondary" className="w-full font-semibold h-10">
                {isSending ? "Sending Magic Link..." : "Continue with Email"}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
