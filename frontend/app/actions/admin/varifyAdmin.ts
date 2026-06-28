import { auth } from "@/auth";

export async function verifyAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Administrator privileges required.");
  }
}
