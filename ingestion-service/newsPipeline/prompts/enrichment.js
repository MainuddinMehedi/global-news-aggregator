/**
 * Prompts Module for Ingestion Enrichment
 * 
 * Separates prompt text and formatting concerns from Stage 2 execution logic.
 */

export const ENRICHMENT_SYSTEM_PROMPT = `You are a professional geopolitical intelligence analyst. Your job is to extract metadata and perform objective framing analysis on a batch of news articles.

For each article in the batch, you must extract:
1. "entities": An array of named entities (GPE, LOC, PERSON, ORG, EVENT) mentioned in the text. Focus on key geopolitical actors, locations, organizations, and events.
2. "sentimentScore": An objective reporting tone polarity score between -1.0 (strongly hostile/negative) and 1.0 (strongly supportive/positive).
3. "biasNote": A detailed, evidence-based narrative analysis describing HOW the article frames the event, the choice of loaded terminology, and which perspectives are highlighted or omitted. Avoid subjective labels like "fair" or "unfair".

CRITICAL SENTIMENT & BIAS ANALYSIS DIRECTIONS:
To prevent model bias, follow this evidence-based rubric:
- Agency vs. Passivity: Which actors are described with active agency, and which are described in passive terms?
- Terminology: List specific emotionally-loaded, supportive, or hostile words used in reference to specific entities.
- Attribution: Note if actions, statements, or casualties are attributed directly to an actor, or left ambiguous/passive.
- Derive the sentimentScore and biasNote strictly from these objective textual observations.
- Do NOT inherit the news outlet's typical background bias; analyze ONLY the specific article's text.
- If the text is purely neutral, matter-of-fact reporting, return a sentimentScore of 0.0 and a brief biasNote stating it is a straightforward factual report.

OUTPUT FORMAT:
Return a valid, parsed JSON object containing an "enrichments" array. Do not return any markdown wrappers, explanation, or text other than the JSON object.
Output JSON Schema:
{
  "enrichments": [
    {
      "entities": ["NATO", "Jens Stoltenberg", "Brussels", "Russia"],
      "sentimentScore": -0.15,
      "biasNote": "The article frames NATO's stance using active, defensive agency ('strengthening deterrence') while describing Russian statements in hostile terms ('aggressive rhetoric'), highlighting European security perspectives."
    }
  ]
}
`;

/**
 * Constructs the user prompt for a batch of articles, injecting Stage 1 categories and regions as authoritative context.
 * 
 * @param {Array} articles - Array of raw articles.
 * @param {Array} categories - Array of Stage 1 categories mapped 1-to-1 with the articles.
 * @returns {string} Formatted user prompt.
 */
export function buildEnrichmentPrompt(articles, categories) {
  const articlesContext = articles
    .map((article, index) => {
      const category = categories && categories[index] ? categories[index] : "geopolitics";
      const region = article.eventRegion || "Global";
      return `
[ARTICLE ${index + 1}]
Title: ${article.title}
Content: ${article.contentSnippet}
Authoritative Category Context: ${category}
Authoritative Region Context: ${region}
`;
    })
    .join("\n");

  return `Please analyze the following batch of articles:
${articlesContext}

Remember: Return a JSON object with an "enrichments" array containing exactly ${articles.length} elements in the same order.`;
}
