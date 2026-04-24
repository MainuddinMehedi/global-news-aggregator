import pLimit from "p-limit";
import { prisma } from "../db/client.js";

const limit = pLimit(3); // Max 3 concurrent AI/DB ops
const AI_BUFFER_SIZE = 5;

export function createAIBuffer() {
  const buffer = [];
  let processing = false;

  async function flush() {
    if (buffer.length === 0 || processing) return;
    processing = true;

    const batch = buffer.splice(0, AI_BUFFER_SIZE);
    await Promise.all(
      batch.map((article) => limit(() => processAndSave(article))),
    );

    processing = false;
  }

  async function processAndSave(article) {
    const prompt = `You are a geopolitical news analyst. Process this article:
                    TITLE: ${article.title}
                    CONTENT: ${article.contentSnippet}
                    SOURCE: ${article.source} (Country: ${article.sourceCountry})
                    Return valid JSON only.`;

    try {
      const res = await fetch(
        `${process.env.AI_BASE_URL}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.AI_API_KEY}`,
          },
          body: JSON.stringify({
            model: process.env.AI_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
          }),
        },
      );

      const data = await res.json();
      let parsed;

      try {
        parsed = JSON.parse(
          data.choices[0].message.content.replace(/```json|```/g, ""),
        );
      } catch {
        parsed = {
          categories: ["other"],
          entities: [],
          sentimentScore: 0,
          biasNote: "",
          perspectiveCountries: [],
        };
      }

      await prisma.article.create({
        data: {
          ...article,
          categories: {
            connectOrCreate: parsed.categories.map((c) => ({
              where: { name: c },
              create: { name: c },
            })),
          },
          entities: parsed.entities,
          sentimentScore: parsed.sentimentScore,
          biasNote: parsed.biasNote,
          perspectiveCountries: parsed.perspectiveCountries,
          contentHash: null, // Will be set if needed, or compute beforehand
        },
      });
    } catch (err) {
      console.error(`[AI/DB Error] ${article.title}:`, err.message);
    }
  }

  return {
    push(article) {
      buffer.push(article);
      if (buffer.length >= AI_BUFFER_SIZE) flush();
    },
    flush,
  };
}
