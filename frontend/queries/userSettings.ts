import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { cache } from "react";

export const getCachedUserSettings = cache(async () => {
  const session = await auth();
  if (!session?.user?.email) return {};

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { settings: true },
  });

  return (user?.settings || {}) as any;
});
