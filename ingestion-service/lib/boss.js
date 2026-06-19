import "dotenv/config";
import { PgBoss } from "pg-boss";

const boss = new PgBoss(process.env.DATABASE_URL);

boss.on("error", (error) => console.error("❌ [pg-boss] Error:", error));

export async function startBoss() {
  if (!boss.isStarted) {
    await boss.start();
    await boss.createQueue("scan-queue");
  }
  return boss;
}

export default boss;
