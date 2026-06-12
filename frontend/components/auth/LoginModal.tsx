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

          <div className="mt-6 space-y-5">
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
                  className="bg-background"
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
                  className="bg-background"
                />
              </div>
              <Button type="submit" disabled={isSending} className="w-full font-semibold">
                {isSending ? "Sending Magic Link..." : "Continue with Email"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-medium">Or</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full font-semibold" 
              onClick={() => signIn("google", { callbackUrl: pathname })}
            >
              Continue with Google
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
