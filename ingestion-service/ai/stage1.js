import { CATEGORY_KEYWORDS, REGION_KEYWORDS } from "./gazetteer.js";

function getMatchCount(text, keywords) {
  let count = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) {
      count++;
    }
  }
  return count;
}

export function enrichWithStage1(rawArticle) {
  const content = `${rawArticle.title || ""} ${rawArticle.contentSnippet || ""}`.toLowerCase();
  
  // 1. Categories
  let bestCategory = "other";
  let maxCategoryMatches = 0;
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = getMatchCount(content, keywords);
    if (matches > maxCategoryMatches) {
      maxCategoryMatches = matches;
      bestCategory = category;
    }
  }

  // 2. Region
  let bestRegion = null;
  let maxRegionMatches = 0;
  
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    const matches = getMatchCount(content, keywords);
    if (matches > maxRegionMatches) {
      maxRegionMatches = matches;
      bestRegion = region;
    }
  }

  // Fallback to feed origin if no explicit region is mentioned in text
  if (!bestRegion && rawArticle.sourceOrigin && rawArticle.sourceOrigin !== "Global") {
    bestRegion = rawArticle.sourceOrigin;
  }

  // 3. Inherit Bias and Perspective
  // The perspective country is generally the source's country, unless it's global.
  const perspectiveCountries = [];
  if (rawArticle.sourceCountry && rawArticle.sourceCountry !== "Global") {
    perspectiveCountries.push(rawArticle.sourceCountry);
  }

  const biasNote = rawArticle.biasGroup ? `Inherited from source (${rawArticle.biasGroup})` : null;

  return {
    categories: [bestCategory],
    eventRegion: bestRegion,
    perspectiveCountries: perspectiveCountries,
    biasNote: biasNote,
  };
}
