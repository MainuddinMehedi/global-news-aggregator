"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Globe } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

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
        callbackUrl,
        redirect: false 
      });

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

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome to GlobalAgg</h1>
        <p className="text-sm text-muted-foreground">
          Sign in or create an account to save bookmarks and customize your feed.
        </p>
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
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <Button 
        type="button" 
        variant="outline" 
        className="w-full font-semibold" 
        onClick={() => signIn("google", { callbackUrl })}
      >
        Continue with Google
      </Button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background">
      <Link href="/" className="absolute top-8 left-8">
        <div className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
            <HugeiconsIcon icon={Globe} className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block text-foreground">
            GlobalAgg<span className="text-primary">.</span>
          </span>
        </div>
      </Link>
      
      <div className="w-full max-w-md p-8 bg-card border border-border shadow-lg rounded-2xl">
        <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-xl w-full" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
