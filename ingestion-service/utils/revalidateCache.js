/**
 * Triggers cache revalidation for the specified tags on the Next.js frontend.
 * Catches connection errors and logs success or warning status messages.
 *
 * @param {string[]} tags - Array of tags to revalidate
 * @returns {Promise<void>}
 */
export default async function revalidateCache(tags) {
  if (!tags || tags.length === 0) return;

  try {
    const nextApiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const revalidateSecret = process.env.REVALIDATE_SECRET || "";

    console.log(`\n🔄 Revalidating cache...`);

    for (const tag of tags) {
      const res = await fetch(
        `${nextApiUrl}/revalidate?tag=${tag}&secret=${revalidateSecret}`,
      );
      if (!res.ok) {
        console.warn(`⚠️ Failed to revalidate tag: ${tag} (${res.status})`);
      } else {
        console.log(`✓ Revalidated: ${tag}`);
      }
    }
  } catch (err) {
    console.error("⚠️ Cache revalidation failed:", err.message);
  }
}
