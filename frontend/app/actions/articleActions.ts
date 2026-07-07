"use server";

import { getArticleById } from "@/queries/articles";

export async function getArticleDetails(slug: string) {
  try {
    const article = await getArticleById(slug);
    if (!article) return { error: "Article not found" };
    return { article };
  } catch (error) {
    console.error("Error fetching article details:", error);
    return { error: "Failed to fetch article details" };
  }
}
