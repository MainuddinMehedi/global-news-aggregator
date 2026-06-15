from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from gliner import GLiNER

app = FastAPI(title="Global News Aggregator - Enrichment Service")

# Initialize models
print("Loading GLiNER model (urchade/gliner_small-v2.1)...")
model = GLiNER.from_pretrained("urchade/gliner_small-v2.1")
print("GLiNER model loaded successfully!")

analyzer = SentimentIntensityAnalyzer()

class ArticleRequest(BaseModel):
    text: str
    category: str

class ArticleBatchRequest(BaseModel):
    articles: List[ArticleRequest]

class Entity(BaseModel):
    text: str
    label: str

class EnrichmentResponse(BaseModel):
    entities: List[str]
    sentimentScore: float

class BatchEnrichmentResponse(BaseModel):
    results: List[EnrichmentResponse]

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/analyze", response_model=EnrichmentResponse)
def analyze_article(req: ArticleRequest):
    text = req.text
    if not text:
        return EnrichmentResponse(entities=[], sentimentScore=0.0)
    
    # 1. Named Entity Recognition
    soft_news_cats = {"lifestyle", "entertainment", "sports", "gaming", "technology", "science"}
    if req.category in soft_news_cats:
        labels = ["Person", "Organization", "Product", "Event", "Artwork", "Facility"]
    else:
        labels = ["Person", "Organization", "Location", "Geopolitical Entity"]
    
    try:
        ents = model.predict_entities(text, labels, threshold=0.5)
        raw_entities = [ent['text'] for ent in ents]
    except Exception as e:
        print(f"GLiNER prediction failed: {e}")
        raw_entities = []
    
    # Deduplicate and clean entities
    unique_entities = list(set([e.strip() for e in raw_entities if len(e.strip()) > 2]))
    
    # 2. Sentiment Analysis
    sentiment_dict = analyzer.polarity_scores(text)
    compound_score = sentiment_dict['compound']
    
    return EnrichmentResponse(
        entities=unique_entities[:15], # Limit to top 15 entities to avoid db bloat
        sentimentScore=compound_score
    )

@app.post("/analyze/batch", response_model=BatchEnrichmentResponse)
def analyze_batch(req: ArticleBatchRequest):
    results = []
    
    soft_news_cats = {"lifestyle", "entertainment", "sports", "gaming", "technology", "science"}
    
    for article in req.articles:
        if not article.text:
            results.append(EnrichmentResponse(entities=[], sentimentScore=0.0))
            continue
            
        if article.category in soft_news_cats:
            labels = ["Person", "Organization", "Product", "Event", "Artwork", "Facility"]
        else:
            labels = ["Person", "Organization", "Location", "Geopolitical Entity"]
            
        try:
            ents = model.predict_entities(article.text, labels, threshold=0.5)
            raw_entities = [ent['text'] for ent in ents]
        except Exception as e:
            print(f"GLiNER prediction failed: {e}")
            raw_entities = []
            
        unique_entities = list(set([e.strip() for e in raw_entities if len(e.strip()) > 2]))
        
        sentiment_dict = analyzer.polarity_scores(article.text)
        results.append(EnrichmentResponse(
            entities=unique_entities[:15],
            sentimentScore=sentiment_dict['compound']
        ))
        
    return BatchEnrichmentResponse(results=results)
