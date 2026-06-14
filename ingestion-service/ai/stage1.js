import { CATEGORY_KEYWORDS, REGION_KEYWORDS } from "./gazetteer.js";

// 1. Compile dictionaries into Regex with Word Boundaries (\b) ONCE at startup
function compileDictionary(dict) {
  const compiled = {};
  for (const [key, keywords] of Object.entries(dict)) {
    // \b ensures we match the exact word. 'gi' means global and case-insensitive.
    // We replace spaces with \s+ to handle weird formatting in scraped text.
    const pattern = keywords.map(kw => `\\b${kw.replace(/\s+/g, '\\s+')}\\b`).join('|');
    compiled[key] = new RegExp(pattern, 'gi');
  }
  return compiled;
}

const COMPILED_CATEGORIES = compileDictionary(CATEGORY_KEYWORDS);
const COMPILED_REGIONS = compileDictionary(REGION_KEYWORDS);

function getRegexMatchCount(text, regex) {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

export function enrichWithStage1(rawArticle) {
  const content = `${rawArticle.title || ""} ${rawArticle.contentSnippet || ""}`;
  
  // 1. Categories
  let bestCategory = "other";
  let maxCategoryMatches = 0;
  
  for (const [category, regex] of Object.entries(COMPILED_CATEGORIES)) {
    const matches = getRegexMatchCount(content, regex);
    if (matches > maxCategoryMatches) {
      maxCategoryMatches = matches;
      bestCategory = category;
    }
  }

  // 2. Region
  let bestRegion = null;
  let maxRegionMatches = 0;
  
  for (const [region, regex] of Object.entries(COMPILED_REGIONS)) {
    const matches = getRegexMatchCount(content, regex);
    if (matches > maxRegionMatches) {
      maxRegionMatches = matches;
      bestRegion = region;
    }
  }

  // Fallback to feed origin if no explicit region is mentioned in text
  if (!bestRegion && rawArticle.sourceOrigin && rawArticle.sourceOrigin !== "Global") {
    bestRegion = rawArticle.sourceOrigin;
  }

  // 3. Inherit Bias (Removed perspectiveCountry inheritance)
  const perspectiveCountries = []; // Leave empty unless a smarter model deduces it later

  const biasNote = rawArticle.biasGroup ? `Inherited from source (${rawArticle.biasGroup})` : null;

  return {
    categories: [bestCategory],
    eventRegion: bestRegion,
    perspectiveCountries: perspectiveCountries,
    biasNote: biasNote,
  };
}
