import { PgBoss } from "pg-boss";

// Note: Next.js API routes will have process.env.DATABASE_URL available
const boss = new PgBoss(process.env.DATABASE_URL as string);

boss.on("error", (error) => console.error("❌ [pg-boss] Error:", error));

export async function startBoss() {
  if (!(boss as any).isStarted) {
    await boss.start();
    await boss.createQueue("topics-queue");
  }
  return boss;
}

export default boss;
