import prisma from "../db/prisma.js";

/**
 * Deletes all ChatSessions that do not have an associated userId
 * and haven't been updated in the last 24 hours.
 */
export async function cleanupAnonymousChats() {
  console.log("🧹 [Cleanup] Starting stale anonymous chat cleanup...");

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const result = await prisma.chatSession.deleteMany({
      where: {
        userId: null,
        updatedAt: {
          lt: twentyFourHoursAgo,
        },
      },
    });

    console.log(`🧹 [Cleanup] Removed ${result.count} stale anonymous chat sessions.`);
  } catch (error) {
    console.error("❌ [Cleanup] Error removing anonymous chats:", error);
    throw error;
  }
}
