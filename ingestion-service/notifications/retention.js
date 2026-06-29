import { prisma } from "../db/prisma.js";

const ADMIN_NOTIFICATION_TYPES = [
  'PIPELINE_FAILURE',
  'INGESTION_STALLED',
  'HIGH_FAILURE_RATE',
  'AI_PROVIDER_DEGRADED',
  'REVALIDATION_FAILED',
  'TOPIC_SOURCE_DEGRADED'
];

export async function cleanupNotifications() {
  console.log(`🧹 [Notification Retention] Cleaning up old notifications...`);
  
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    
    const deletedUser = await prisma.notification.deleteMany({
      where: {
        type: {
          notIn: ADMIN_NOTIFICATION_TYPES
        },
        createdAt: { lt: thirtyDaysAgo }
      }
    });

    const deletedAdmin = await prisma.notification.deleteMany({
      where: {
        type: {
          in: ADMIN_NOTIFICATION_TYPES
        },
        createdAt: { lt: sixtyDaysAgo }
      }
    });

    console.log(`🧹 [Notification Retention] Cleaned up ${deletedUser.count} user and ${deletedAdmin.count} admin notifications.`);
  } catch (err) {
    console.error(`🧹 [Notification Retention] Failed to clean up notifications:`, err);
  }
}
