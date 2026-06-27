import { getAdminNotificationConfigs } from "@/queries/admin/notifications";
import NotificationConfigTab from "../NotificationConfigTab";

export default async function NotificationConfigTabWrapper() {
  const configs = await getAdminNotificationConfigs();
  return <NotificationConfigTab configs={configs} />;
}
