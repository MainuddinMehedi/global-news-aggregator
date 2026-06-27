import { getUsers } from "@/queries/admin/users";
import UserAdminTab from "../UserAdminTab";

export default async function UserAdminTabWrapper({ searchQuery }: { searchQuery: string }) {
  const users = await getUsers(searchQuery);
  return <UserAdminTab users={users} searchQuery={searchQuery} />;
}
