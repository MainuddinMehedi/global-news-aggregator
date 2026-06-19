import * as cheerio from "cheerio";

/**
 * Extracts and returns clean text from HTML by stripping out common boilerplate
 * elements like scripts, styles, navigation, footers, headers, and ads.
 * 
 * @param {string} html - The HTML string to parse.
 * @returns {string} The cleaned text content.
 */
export function extractCleanText(html) {
  const $ = cheerio.load(html);

  // Remove common boilerplate elements
  $(
    "script, style, nav, footer, header, noscript, iframe, .ads, .sidebar, #comments",
  ).remove();

  // Get text, collapse whitespace
  return $("body").text().replace(/\s+/g, " ").trim();
}
