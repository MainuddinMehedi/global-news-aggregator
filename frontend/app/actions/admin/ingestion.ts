"use server";

import { startBoss } from "@/lib/boss";
import { verifyAdmin } from "./varifyAdmin";

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
