import { prisma } from "../db/prisma.js";

export async function cleanupNotifications() {
  console.log(`🧹 [Notification Retention] Cleaning up old notifications...`);
  
  try {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    
    const deleted = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: sixtyDaysAgo }
      }
    });

    console.log(`🧹 [Notification Retention] Deleted ${deleted.count} old notifications.`);
  } catch (err) {
    console.error(`🧹 [Notification Retention] Failed to clean up notifications:`, err);
  }
}
