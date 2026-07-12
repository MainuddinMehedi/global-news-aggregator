"use server";

import { auth } from "@/auth";
import { DEFAULT_SETTINGS } from "@/constants/settings";
import prisma from "@/lib/prisma";
import { DbSettings } from "@/types/settings";
import { revalidatePath, updateTag } from "next/cache";

export async function getUserSettings() {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { settings: true },
  });

  return { email: session.user.email, settings: (user?.settings as any) || {} };
}

export async function saveUserSettingsAction(settings: any) {
  const { email } = await getUserSettings();

  await prisma.user.update({
    where: { email },
    data: { settings },
  });

  // Force immediate cache expiry for articles feed
  updateTag("articles");
}

export async function updateSingleSettingAction(
  key: keyof DbSettings,
  value: any,
) {
  const { email, settings } = await getUserSettings();

  // Implement aggressive sparsity:
  // If the incoming value exactly matches the master default, delete it from the DB settings
  // so we don't store boilerplate JSON. Otherwise, save the new value.
  if (
    value === DEFAULT_SETTINGS[key] ||
    (Array.isArray(value) &&
      Array.isArray(DEFAULT_SETTINGS[key]) &&
      JSON.stringify(value) === JSON.stringify(DEFAULT_SETTINGS[key]))
  ) {
    delete settings[key];
  } else {
    settings[key] = value;
  }

  await prisma.user.update({
    where: { email },
    data: { settings },
  });

  if (
    [
      "favoriteCategories",
      "hiddenCategories",
      "feedDefaultCategory",
      "feedDefaultSort",
      "feedDefaultRegion",
      "homePageMode",
      "articlesPerPage",
    ].includes(key)
  ) {
    updateTag("articles");
    revalidatePath("/", "layout");
  }
}

export async function toggleBuiltinSourceAction(url: string, enabled: boolean) {
  const { email, settings } = await getUserSettings();

  let disabledBuiltinSources = settings.disabledBuiltinSources || [];

  if (enabled) {
    disabledBuiltinSources = disabledBuiltinSources.filter(
      (u: string) => u !== url,
    );
  } else {
    if (!disabledBuiltinSources.includes(url)) {
      disabledBuiltinSources.push(url);
    }
  }

  settings.disabledBuiltinSources = disabledBuiltinSources;

  await prisma.user.update({
    where: { email },
    data: { settings },
  });

  updateTag("articles");
  revalidatePath("/", "layout");
}
