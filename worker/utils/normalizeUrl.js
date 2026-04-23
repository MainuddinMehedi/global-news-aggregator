export default function normalizeUrl(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url.toLowerCase().replace(/\/$/, ""));

    // Remove common tracking parameters
    const paramsToRemove = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "ref",
      "ref_",
    ];

    paramsToRemove.forEach((param) => urlObj.searchParams.delete(param));

    return urlObj.toString();
  } catch (err) {
    console.log("error normalizing url", url, err);
    return null;
  }
}
