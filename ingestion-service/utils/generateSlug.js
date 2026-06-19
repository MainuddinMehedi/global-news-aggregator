export function generateSlug(title) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const shortId = Math.random().toString(36).substring(2, 8);
  return `${base.substring(0, 80)}-${shortId}`;
}
