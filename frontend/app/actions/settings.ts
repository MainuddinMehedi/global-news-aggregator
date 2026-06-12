"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { updateTag } from "next/cache";
import { revalidatePath } from "next/cache";

async function getUserSettings() {
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

export async function updateSingleSettingAction(key: string, value: any) {
  const { email, settings } = await getUserSettings();

  settings[key] = value;

  await prisma.user.update({
    where: { email },
    data: { settings },
  });

  if (["hiddenCategories", "extraCategories", "feedDefaultCategory", "feedDefaultSort", "showBiasBadges"].includes(key)) {
    updateTag("articles");
    revalidatePath("/", "layout");
  }
}

export async function addCustomSourceAction(source: any) {
  const { email, settings } = await getUserSettings();

  const customSources = settings.customSources || [];
  settings.customSources = [...customSources, source];

  await prisma.user.update({
    where: { email },
    data: { settings },
  });

  updateTag("articles");
  revalidatePath("/", "layout");
}

export async function removeCustomSourceAction(id: string) {
  const { email, settings } = await getUserSettings();

  const customSources = settings.customSources || [];
  settings.customSources = customSources.filter((s: any) => s.id !== id);

  await prisma.user.update({
    where: { email },
    data: { settings },
  });

  updateTag("articles");
  revalidatePath("/", "layout");
}

export async function toggleCustomSourceAction(id: string, enabled: boolean) {
  const { email, settings } = await getUserSettings();

  const customSources = settings.customSources || [];
  settings.customSources = customSources.map((s: any) =>
    s.id === id ? { ...s, enabled } : s
  );

  await prisma.user.update({
    where: { email },
    data: { settings },
  });

  updateTag("articles");
  revalidatePath("/", "layout");
}

export async function toggleBuiltinSourceAction(url: string, enabled: boolean) {
  const { email, settings } = await getUserSettings();

  let disabledBuiltinSources = settings.disabledBuiltinSources || [];
  
  if (enabled) {
    disabledBuiltinSources = disabledBuiltinSources.filter((u: string) => u !== url);
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
