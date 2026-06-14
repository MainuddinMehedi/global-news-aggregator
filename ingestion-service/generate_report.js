import 'dotenv/config';
import { prisma } from './db/prisma.js';
import fs from 'fs';

async function generateSample() {
  const articles = await prisma.processedArticle.findMany({
    where: { model: 'local-pipeline-v1' },
    orderBy: { processedAt: 'desc' },
    take: 30,
    include: {
      rawArticle: true
    }
  });

  let md = `# Quality & Accuracy Review Sample\n\n`;
  md += `Here is a random sample of 30 recently processed articles using the \`local-pipeline-v1\` architecture. Please review to check if the deterministic mapping and local ML outputs actually make sense for the article content.\n\n`;

  articles.forEach((pa, index) => {
    md += `## ${index + 1}. ${pa.rawArticle.title}\n`;
    md += `- **Source:** ${pa.rawArticle.source} | **URL:** [Link](${pa.rawArticle.url})\n`;
    md += `- **Summary:** ${pa.rawArticle.contentSnippet || "N/A"}\n\n`;
    md += `### Stage 1 (Deterministic Heuristics)\n`;
    md += `- **Event Region:** \`${pa.eventRegion || "null"}\`\n`;
    md += `- **Categories:** \`${(pa.categories?.map(c => c.name) || pa.categories || []).join(", ") || "none"}\`\n`;
    md += `- **Perspective Countries:** \`${(pa.perspectiveCountries || []).join(", ") || "none"}\`\n`;
    md += `- **Bias Note:** ${pa.biasNote || "None"}\n\n`;
    md += `### Stage 2 (Local ML Python Microservice)\n`;
    md += `- **Entities:** \`${(pa.entities || []).join(", ")}\`\n`;
    md += `- **Sentiment Score:** \`${pa.sentimentScore !== null ? pa.sentimentScore : "null"}\`\n`;
    md += `---\n\n`;
  });

  fs.writeFileSync('accuracy_sample.md', md);
  console.log('Sample written to accuracy_sample.md');
}

generateSample()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
