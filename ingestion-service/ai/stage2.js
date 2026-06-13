const ENRICHMENT_SERVICE_URL = process.env.ENRICHMENT_SERVICE_URL || "http://localhost:8000";

export async function enrichWithStage2Batch(articles) {
  if (!articles || articles.length === 0) return [];

  const payload = {
    articles: articles.map(article => ({
      text: `${article.title || ""} ${article.contentSnippet || ""}`.trim()
    }))
  };

  try {
    const response = await fetch(`${ENRICHMENT_SERVICE_URL}/analyze/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Enrichment service responded with ${response.status}`);
    }

    const data = await response.json();
    
    // Map results back to articles
    return articles.map((article, index) => {
      const enrichment = data.results[index];
      return {
        ...article,
        entities: enrichment.entities || [],
        sentimentScore: enrichment.sentimentScore || 0.0
      };
    });
  } catch (err) {
    console.warn(`⚠️ Stage 2 Enrichment failed: ${err.message}. Bypassing NLP extraction for this batch.`);
    
    // Gracefully fallback to empty entities/sentiment if service is down
    return articles.map(article => ({
      ...article,
      entities: [],
      sentimentScore: null
    }));
  }
}
