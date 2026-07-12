import { auth } from "@/auth";
import { DEFAULT_SETTINGS } from "@/constants/settings";
import prisma from "@/lib/prisma";
import { cache } from "react";

export const getCachedUserSettings = cache(async () => {
  const session = await auth();
  if (!session?.user?.email) return DEFAULT_SETTINGS;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { settings: true },
  });

  return { ...DEFAULT_SETTINGS, ...((user?.settings as any) || {}) };
});
