import { prisma } from "../db/prisma.js";

/**
 * Creates a new Notification and its associated deliveries.
 */
export async function enqueueNotification({ userId, type, title, message, priority, payload, channels }) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      priority,
      payload: payload || {},
      deliveries: {
        create: channels.map(channel => ({
          channel,
        }))
      }
    },
    include: {
      deliveries: true
    }
  });

  return notification;
}

/**
 * Claims pending deliveries for processing.
 * Only picks up undelivered items with retryCount < 3.
 */
export async function claimPendingDeliveries(limit = 50) {
  return await prisma.notificationDelivery.findMany({
    where: {
      deliveredAt: null,
      retryCount: { lt: 3 },
    },
    include: {
      notification: true,
    },
    take: limit,
    orderBy: {
      createdAt: 'asc'
    }
  });
}

/**
 * Marks a delivery as successful.
 */
export async function markDelivered(deliveryId) {
  return await prisma.notificationDelivery.update({
    where: { id: deliveryId },
    data: { deliveredAt: new Date() }
  });
}

/**
 * Marks a delivery as failed and increments retry count.
 */
export async function markFailed(deliveryId, error) {
  return await prisma.notificationDelivery.update({
    where: { id: deliveryId },
    data: {
      error: error.message || String(error),
      retryCount: { increment: 1 }
    }
  });
}
