"use server";

import { getStoryDetail } from "@/queries/stories";
import { getPublisherRegion } from "@/utils/regions";

export async function getStoryDetails(slug: string) {
  try {
    const story = await getStoryDetail(slug);
    if (!story) return { error: "Story not found" };

    const uniqueSourcesMap = new Map<string, string>();
    story.articles.forEach((art: any) => {
      if (
        art.rawArticle.source &&
        !uniqueSourcesMap.has(art.rawArticle.source)
      ) {
        uniqueSourcesMap.set(art.rawArticle.source, art.rawArticle.url);
      }
    });

    const sources = Array.from(uniqueSourcesMap.entries()).map(
      ([name, url]) => ({
        name,
        url,
      }),
    );

    const origins = Array.from(
      new Set(
        story.articles
          .map((a: any) => getPublisherRegion(a.rawArticle.sourceCountry))
          .filter((o): o is string => !!o),
      ),
    );

    return { story, sources, origins };
  } catch (error) {
    console.error("Error fetching story details:", error);
    return { error: "Failed to fetch story details" };
  }
}
