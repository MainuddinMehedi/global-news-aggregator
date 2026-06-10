import { scanYoutube } from "./ingestion-service/topics/sources/youtubeScanner.js";

const topic = {
  displayName: "AI Breakthroughs",
  aiRefinedQuery: `(OpenAI OR DeepSeek OR Google OR "artificial intelligence") AND (breakthrough OR release OR "corporate news" OR "product launch")`,
  lastScannedAt: new Date(0)
};

const sourceConfig = {
  url: "https://www.youtube.com/@mkbhd, linus tech tips",
  label: "Tech Youtube"
};

async function test() {
  console.log("Starting test...");
  const findings = await scanYoutube(topic, sourceConfig);
  console.log("Findings:");
  console.log(JSON.stringify(findings, null, 2));
}

test();
