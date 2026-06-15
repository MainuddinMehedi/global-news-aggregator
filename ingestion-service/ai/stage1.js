import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load Gazetteer JSON
const gazetteerPath = path.join(__dirname, '../data/gazetteer.json');
const gazetteerData = JSON.parse(fs.readFileSync(gazetteerPath, 'utf8'));

// 2. Compile dictionaries into Regex with Word Boundaries (\b) ONCE at startup
function compileDictionary(dictGroup) {
  const compiled = {};
  for (const [key, rules] of Object.entries(dictGroup)) {
    // Compile inclusion terms
    const terms = Object.keys(rules.terms);
    const termsPattern = terms.map(kw => `\\b${kw.replace(/\s+/g, '\\s+')}\\b`).join('|');
    const termsRegex = termsPattern ? new RegExp(termsPattern, 'gi') : null;

    // Compile exclusion terms
    let exclusionsRegex = null;
    if (rules.exclusions && rules.exclusions.length > 0) {
      const exclusionsPattern = rules.exclusions.map(kw => `\\b${kw.replace(/\s+/g, '\\s+')}\\b`).join('|');
      exclusionsRegex = new RegExp(exclusionsPattern, 'gi');
    }

    compiled[key] = {
      termsRegex,
      exclusionsRegex,
      weights: rules.terms
    };
  }
  return compiled;
}

const COMPILED_CATEGORIES = compileDictionary(gazetteerData.categories);
const COMPILED_REGIONS = compileDictionary(gazetteerData.regions);

function getScore(text, compiledRules) {
  let score = 0;
  
  // Hard Exclusion Check: Zero out score if an exclusion matches
  if (compiledRules.exclusionsRegex && compiledRules.exclusionsRegex.test(text)) {
    return 0; 
  }

  // Weight Calculation Check
  if (compiledRules.termsRegex) {
    const matches = text.match(compiledRules.termsRegex);
    if (matches) {
      for (const match of matches) {
        // Normalize the matched string to find the correct weight key (lowercase, collapse spaces)
        const normalizedMatch = match.toLowerCase().replace(/\s+/g, ' ');
        if (compiledRules.weights[normalizedMatch]) {
          score += compiledRules.weights[normalizedMatch];
        }
      }
    }
  }
  return score;
}

export function enrichWithStage1(rawArticle) {
  const content = `${rawArticle.title || ""} ${rawArticle.contentSnippet || ""}`;
  
  // 1. Categories
  let bestCategory = "other";
  let maxCategoryScore = 0;
  
  for (const [category, rules] of Object.entries(COMPILED_CATEGORIES)) {
    const score = getScore(content, rules);
    if (score > maxCategoryScore) {
      maxCategoryScore = score;
      bestCategory = category;
    }
  }

  // 2. Region
  let bestRegion = null;
  let maxRegionScore = 0;
  
  for (const [region, rules] of Object.entries(COMPILED_REGIONS)) {
    const score = getScore(content, rules);
    if (score > maxRegionScore) {
      maxRegionScore = score;
      bestRegion = region;
    }
  }

  return {
    categories: [bestCategory],
    eventRegion: bestRegion,
  };
}
