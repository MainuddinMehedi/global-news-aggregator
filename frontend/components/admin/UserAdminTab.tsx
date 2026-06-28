import { UserAdminData } from "@/queries/admin/users";
import UserSearch from "./users/UserSearch";
import UserTable from "./users/UserTable";

interface UserAdminTabProps {
  users: UserAdminData[];
  searchQuery?: string;
}

export default function UserAdminTab({ users, searchQuery = "" }: UserAdminTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">User Administration</h2>
          <p className="text-muted-foreground text-xs mt-1">
            Audit registered accounts, elevate administrator permissions, and manage platform suspensions.
          </p>
        </div>
        <UserSearch defaultValue={searchQuery} />
      </div>

      <UserTable users={users} />
    </div>
  );
}
