"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserAdminData } from "@/queries/admin/users";
import { updateUserRole, toggleUserSuspension } from "@/app/actions/admin/users";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserTableProps {
  users: UserAdminData[];
}

export default function UserTable({ users }: UserTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (userId: string, currentRole: "USER" | "ADMIN") => {
    const newRole = currentRole === "USER" ? "ADMIN" : "USER";
    const confirmMsg =
      currentRole === "USER"
        ? "Are you sure you want to promote this user to Administrator? This grants full control over settings and feed sources."
        : "Are you sure you want to demote this Administrator to a standard User? Their active sessions will be terminated.";

    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      const res = await updateUserRole(userId, newRole);
      if (res.success) {
        toast.success(`User role updated to ${newRole} successfully.`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update user role.");
      }
    });
  };

  const handleSuspensionChange = (userId: string, currentSuspended: boolean) => {
    const newSuspended = !currentSuspended;
    const confirmMsg = newSuspended
      ? "Are you sure you want to suspend this user? They will be immediately signed out of all devices and blocked from logging in."
      : "Are you sure you want to unsuspend this user? They will be permitted to log in again.";

    if (newSuspended && !confirm(confirmMsg)) return;

    startTransition(async () => {
      const res = await toggleUserSuspension(userId, newSuspended);
      if (res.success) {
        toast.success(newSuspended ? "User account suspended." : "User account unsuspended.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update suspension status.");
      }
    });
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/10 border border-dashed border-border rounded-2xl">
        <p className="text-sm text-muted-foreground">No users found matching the search criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-card/45 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/60 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/20">
              <th className="py-4 px-6">User Info</th>
              <th className="py-4 px-4">Role</th>
              <th className="py-4 px-4">Status</th>
              <th className="py-4 px-4">Joined Date</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {users.map((user) => {
              const initials = user.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : user.email?.slice(0, 2).toUpperCase() || "US";

              return (
                <tr key={user.id} className="hover:bg-muted/10 transition-colors duration-200">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border/50 shadow-sm">
                        <AvatarImage src={user.image || undefined} alt={user.name || "User image"} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate max-w-[180px]">
                          {user.name || "Anonymous User"}
                        </span>
                        <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {user.role === "ADMIN" ? (
                      <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/10">
                        ADMIN
                      </Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground hover:bg-muted">
                        USER
                      </Badge>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {user.suspended ? (
                      <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/10">
                        SUSPENDED
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10">
                        ACTIVE
                      </Badge>
                    )}
                  </td>
                  <td className="py-4 px-4 text-xs text-muted-foreground font-mono">
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Promote/Demote Action */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleRoleChange(user.id, user.role)}
                        className={`h-8 text-xs font-semibold px-3 rounded-lg border-border/50 hover:bg-muted/65 ${
                          user.role === "ADMIN" ? "text-purple-400" : "text-foreground"
                        }`}
                      >
                        {user.role === "ADMIN" ? "Demote" : "Promote"}
                      </Button>

                      {/* Suspend/Unsuspend Action */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleSuspensionChange(user.id, user.suspended)}
                        className={`h-8 text-xs font-semibold px-3 rounded-lg border-border/50 ${
                          user.suspended
                            ? "text-emerald-400 hover:bg-emerald-500/5 hover:border-emerald-500/20"
                            : "text-rose-400 hover:bg-rose-500/5 hover:border-rose-500/20"
                        }`}
                      >
                        {user.suspended ? "Unsuspend" : "Suspend"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
