"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DangerZoneSection() {
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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
    <Card className="border-destructive/30">
      <CardContent className="p-6">
        <div className="space-y-1 mb-4">
          <h4 className="text-sm font-semibold text-destructive">Danger Zone</h4>
          <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
        </div>
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
      </CardContent>
    </Card>
  );
}
