import { requestAI } from "../ai/requestAI.js";
import { primaryConfig } from "../ai/aiConfig.js";
import { countTokens, TOKEN_MULTIPLIER } from "../ai/tokenBatcher.js";
import { getCategoryNames } from "./utils/index.js";

// Clustering responses are larger (assignments + cluster updates + new clusters)
// vs enrichment (categories + entities + sentiment per article).
const RESERVED_CLUSTERING_OUTPUT_TOKENS =
  parseInt(process.env.AI_RESERVED_CLUSTERING_OUTPUT_TOKENS) || 1500;

function getArticleTitle(article) {
  return article.rawArticle?.title || article.title || "Untitled";
}

function getArticleSource(article) {
  return article.rawArticle?.source || article.source || "Unknown";
}

function getArticleSourceCountry(article) {
  return (
    article.rawArticle?.sourceCountry ||
    article.sourceCountry ||
    article.eventRegion ||
    "Unknown"
  );
}

function getArticlePublishedAt(article) {
  return article.rawArticle?.publishedAt || article.publishedAt;
}

function getArticleSummary(article) {
  return article.rawArticle?.contentSnippet || article.contentSnippet || "";
}

export function buildClusteringPrompt(
  articles,
  activeClusters,
  lifecycleConfig = {},
) {
  const { low = 10, medium = 21, high = 35, critical = 60 } = lifecycleConfig;

  const articlesContext = articles
    .map(
      (a, i) => `
[ARTICLE ${i + 1}]
- Ref: ${a.aiRef}
- Title: ${getArticleTitle(a)}
- Source: ${getArticleSource(a)}
- Source Country: ${getArticleSourceCountry(a)}
- Published At: ${getArticlePublishedAt(a) ? new Date(getArticlePublishedAt(a)).toISOString() : "Unknown"}
- Summary: ${getArticleSummary(a)}
- Categories: ${getCategoryNames(a.categories).join(", ") || "Unknown"}
- Entities: ${(a.entities || []).join(", ") || "Unknown"}
- Perspective Countries: ${getArticleSourceCountry(a)}
`,
    )
    .join("\n");

  const clustersContext =
    activeClusters.length === 0
      ? "No active clusters."
      : activeClusters
          .map(
            (c) => `
[CLUSTER]
- Ref: ${c.aiRef}
- Title: ${c.title}
- Summary: ${c.summary}
- Article Count: ${c.articleCount || 0}
- Source Count: ${c.sourceCount || 0}
- Last Activity: ${c.lastActivityAt ? new Date(c.lastActivityAt).toISOString() : "Unknown"}
- Updated At: ${c.updatedAt ? new Date(c.updatedAt).toISOString() : "Unknown"}
- Impact: ${c.impact || "Unknown"}
- Status: ${c.status || "Unknown"}
- Why It Matters: ${c.whyItMatters || "Unknown"}
- Regions: ${(c.regions || []).join(", ") || "Unknown"}
- Themes: ${(c.themes || []).join(", ") || "Unknown"}
- Key Developments: ${JSON.stringify(c.keyDevelopments || [])}
`,
          )
          .join("\n");

  return `You are an expert global news analyst organizing articles into evolving story clusters. You are building an intelligence dossier.

ACTIVE CLUSTERS:
${clustersContext}

NEW ARTICLES TO CLUSTER:
${articlesContext}

TASK:
For each article, decide if it belongs to an EXISTING cluster or if it represents a major NEW developing story.
- If it matches an active cluster, assign its clusterRef.
- If it's a completely new, major developing event, propose a new cluster. (Do not create new clusters for minor, isolated events; those can be assigned to null/unclustered).
- For every existing cluster that receives one or more new articles, update the cluster's intelligence metadata so the dossier reflects the latest reporting.
- Use only articleRef and clusterRef values listed above. Do not invent refs or return database IDs.
- Return one assignment per article, in the same order as NEW ARTICLES TO CLUSTER.

STORY VS TOPIC RUBRIC:
- A story cluster is a specific evolving event, policy move, crisis, negotiation, legal case, military operation, election episode, market shock, or named investigation.
- Do NOT cluster articles together just because they share a broad topic, country, person, sector, or long-running background issue.
- Same country + same theme is not enough on its own. However, if the article is clearly covering the same named event, policy, crisis, or operation from a different regional or cultural perspective, assign it to the existing cluster — multi-perspective coverage of the same development is the goal. A new cluster is only warranted when the article describes a genuinely separate event or a new distinct development.
- Prefer null/unclustered for minor isolated articles or weak matches.
- Create a new cluster when the article is a major development and no existing cluster has the same concrete storyline.
- Reuse an older cluster only when the new article clearly continues that exact storyline; otherwise create a new cluster or leave it unclustered.
- If a cluster has had no activity for more than ${critical} days (CRITICAL), ${high} days (HIGH), ${medium} days (MEDIUM), or ${low} days (LOW), require an exceptionally strong match — same named event, same actors, direct causal continuation — before assigning to it. When in doubt, leave unclustered or create a new cluster.
- Avoid duplicate clusters. If a proposed new story is substantially the same as an active cluster, assign the article to that existing cluster instead.
- For each assignment, include a confidence score from 0 to 1 and a short reason.

For NEW clusters, you MUST generate the following intelligence metadata:
- impact: One of "CRITICAL", "HIGH", "MEDIUM", "LOW"
- status: One of "EMERGING", "ESCALATING", "DEVELOPING", "SLOW_BURN", "STABLE", "RESOLVING"
- whyItMatters: A sharp, 1-line analysis of why this story matters in its native context (e.g., sports, business, geopolitical). Derive this STRICTLY from the text. Do NOT invent geopolitical or economic angles for pure sports, entertainment, or general news.
- regions: Array of affected regions/countries (e.g. ["Middle East", "USA"])
- themes: Array of topics (e.g. ["Trade War", "Elections"])

For EXISTING cluster updates:
- Preserve the original story identity unless the new reporting clearly broadens or narrows the story.
- Rewrite summary to include the newest meaningful development.
- Update impact/status only when the new reporting changes the severity or trajectory.
- Merge regions and themes; keep them concise.
- keyDevelopments: Return ONLY developments from the NEW ARTICLES in this batch that are not already captured in the cluster's existing keyDevelopments above. If nothing is genuinely new, return an empty array []. Do NOT rewrite, rephrase, or repeat existing developments.

OUTPUT FORMAT (strict JSON, no markdown):
{
  "assignments": [
    {
      "articleRef": "article_1",
      "clusterRef": "cluster_1",
      "confidence": 0.86,
      "reason": "Same named negotiation and latest proposal continues the existing story."
    },
    {
      "articleRef": "article_2",
      "clusterRef": null,
      "confidence": 0.35,
      "reason": "Related topic but no concrete shared storyline with active clusters."
    }
  ],
  "clusterUpdates": [
    {
      "clusterRef": "cluster_1",
      "title": "Updated title only if needed",
      "summary": "Updated 1-2 sentence story summary reflecting the newest reporting",
      "timeWindow": "Updated time window if needed",
      "impact": "HIGH",
      "status": "ESCALATING",
      "whyItMatters": "Updated 1-line analysis of why this matters in its native context.",
      "regions": ["China", "USA"],
      "themes": ["Technology", "Sanctions"],
      "keyDevelopments": [] // NEW ones only — empty if nothing new
    }
  ],
  "newClusters": [
    {
      "tempId": "temp-1",
      "title": "Short, punchy title for new story",
      "summary": "1-2 sentence summary of this new evolving narrative",
      "timeWindow": "Just Started",
      "impact": "HIGH",
      "status": "DEVELOPING",
      "whyItMatters": "1-line implication based purely on the article content (e.g., historic sports victory, market shift, or geopolitical disruption).",
      "regions": ["China", "USA"],
      "themes": ["Technology", "Sanctions"],
      "keyDevelopments": [
        { "title": "First major event of this story", "date": "Month Day", "description": "Optional 1-sentence detail" }
      ],
      "articleRefs": ["article_3"]
    }
  ]
}`;
}

export async function processClusteringBatchWithAI(
  batch,
  activeClusters,
  lifecycleConfig = {},
) {
  const prompt = buildClusteringPrompt(batch, activeClusters, lifecycleConfig);

  // Self-calculate: count actual prompt tokens + output reserve, apply multiplier.
  // Clustering prompts are large and variable (depends on number of active clusters),
  // so we always count the real prompt rather than relying on external estimates.
  const rawInputTokens = countTokens(prompt);
  const estimatedTokens = Math.ceil(
    (rawInputTokens + RESERVED_CLUSTERING_OUTPUT_TOKENS) * TOKEN_MULTIPLIER,
  );

  return requestAI(primaryConfig, prompt, estimatedTokens);
}
