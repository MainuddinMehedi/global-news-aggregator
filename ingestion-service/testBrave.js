import "dotenv/config";

async function testBraveKey() {
  const apiKey = process.env.BRAVE_API_KEY;
  const q = "test";

  console.log("Fetching web search...");
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}`,
    {
      headers: { "X-Subscription-Token": apiKey, Accept: "application/json" },
    },
  );

  const data = await res.json();
  console.log("Status:", res.status);
  console.log(JSON.stringify(data, null, 2).substring(0, 300));
}

testBraveKey().catch(console.error);
