"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { startBoss } from "@/lib/boss";

async function verifyAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Administrator privileges required.");
  }
}

export async function toggleFeedSource(id: string, enabled: boolean) {
  await verifyAdmin();
  try {
    const feed = await prisma.feedSource.update({
      where: { id },
      data: { enabled },
    });
    revalidateTag("articles", "max");
    return { success: true, feed };
  } catch (error: any) {
    console.error("toggleFeedSource error:", error);
    return { success: false, error: error.message };
  }
}

export async function resetFeedFailures(id: string) {
  await verifyAdmin();
  try {
    const feed = await prisma.feedSource.update({
      where: { id },
      data: { fetchFailures: 0 },
    });
    return { success: true, feed };
  } catch (error: any) {
    console.error("resetFeedFailures error:", error);
    return { success: false, error: error.message };
  }
}

export async function resetAllFeedFailures() {
  await verifyAdmin();
  try {
    await prisma.feedSource.updateMany({
      data: { fetchFailures: 0 },
    });
    return { success: true };
  } catch (error: any) {
    console.error("resetAllFeedFailures error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteFeedSource(id: string) {
  await verifyAdmin();
  try {
    await prisma.feedSource.delete({
      where: { id },
    });
    return { success: true };
  } catch (error: any) {
    console.error("deleteFeedSource error:", error);
    return { success: false, error: error.message };
  }
}

export async function saveFeedSource(data: {
  id?: string;
  name: string;
  url: string;
  sourceCountry: string;
  sourceType: string;
  biasGroup: string;
  coverageScope: string;
}) {
  await verifyAdmin();
  try {
    const { id, ...payload } = data;
    let feed;
    if (id) {
      feed = await prisma.feedSource.update({
        where: { id },
        data: payload,
      });
    } else {
      feed = await prisma.feedSource.create({
        data: {
          ...payload,
          enabled: true,
          fetchFailures: 0,
        },
      });
    }
    revalidateTag("articles", "max");
    return { success: true, feed };
  } catch (error: any) {
    console.error("saveFeedSource error:", error);
    return { success: false, error: error.message };
  }
}

export async function triggerManualIngestion() {
  await verifyAdmin();
  try {
    const b = await startBoss();
    await b.send("ingest-queue", {});
    return { success: true };
  } catch (error: any) {
    console.error("triggerManualIngestion error:", error);
    return { success: false, error: error.message };
  }
}
