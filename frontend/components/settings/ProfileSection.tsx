"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSetLoginModalOpen } from "@/store";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircle02Icon } from "@hugeicons/core-free-icons";

export default function ProfileSection() {
  const { data: session, status } = useSession();
  const setLoginModalOpen = useSetLoginModalOpen();
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (status === "loading") {
    return <div className="h-40 w-full animate-pulse bg-muted rounded-xl" />;
  }

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <p className="text-muted-foreground">
            Sign in to manage your profile and account settings.
          </p>
          <Button size="sm" onClick={() => setLoginModalOpen(true)}>
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name?: string | null, email?: string | null) => {
    const displayValue = name || email || "?";
    return displayValue.charAt(0).toUpperCase();
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm.");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("/api/user/delete", { method: "POST" });
      if (!res.ok) throw new Error("Failed to delete account");
      
      toast.success("Account deleted successfully. Logging out...");
      signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete account.");
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
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

        <div className="pt-4 border-t border-border/50">
          <h4 className="text-sm font-semibold text-destructive mb-2">Danger Zone</h4>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-destructive">Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account, including your saved topics, custom sources, bookmarks, and chat history.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm font-medium">
                  Please type <span className="font-bold select-none text-foreground">DELETE</span> to confirm.
                </p>
                <Input 
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="max-w-[200px]"
                />
              </div>
              <DialogFooter>
                <Button variant="destructive" disabled={deleteConfirmText !== "DELETE" || isDeleting} onClick={handleDeleteAccount}>
                  {isDeleting ? "Deleting..." : "Permanently Delete Account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
