from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import spacy

app = FastAPI(title="Global News Aggregator - Enrichment Service")

# Initialize models
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import subprocess
    import sys
    print("Downloading en_core_web_sm...")
    subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

analyzer = SentimentIntensityAnalyzer()

class ArticleRequest(BaseModel):
    text: str

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
    doc = nlp(text)
    # We care about geopolitical entities: Persons, Organizations, Geopolitical Entities (GPE), Locations (LOC)
    allowed_labels = {"PERSON", "ORG", "GPE", "LOC"}
    
    raw_entities = [ent.text for ent in doc.ents if ent.label_ in allowed_labels]
    
    # Deduplicate and clean entities
    unique_entities = list(set([e.strip() for e in raw_entities if len(e.strip()) > 2]))
    
    # 2. Sentiment Analysis
    # VADER returns a compound score between -1 (most extreme negative) and +1 (most extreme positive)
    sentiment_dict = analyzer.polarity_scores(text)
    compound_score = sentiment_dict['compound']
    
    return EnrichmentResponse(
        entities=unique_entities[:15], # Limit to top 15 entities to avoid db bloat
        sentimentScore=compound_score
    )

@app.post("/analyze/batch", response_model=BatchEnrichmentResponse)
def analyze_batch(req: ArticleBatchRequest):
    results = []
    for article in req.articles:
        if not article.text:
            results.append(EnrichmentResponse(entities=[], sentimentScore=0.0))
            continue
            
        doc = nlp(article.text)
        allowed_labels = {"PERSON", "ORG", "GPE", "LOC"}
        raw_entities = [ent.text for ent in doc.ents if ent.label_ in allowed_labels]
        unique_entities = list(set([e.strip() for e in raw_entities if len(e.strip()) > 2]))
        
        sentiment_dict = analyzer.polarity_scores(article.text)
        results.append(EnrichmentResponse(
            entities=unique_entities[:15],
            sentimentScore=sentiment_dict['compound']
        ))
        
    return BatchEnrichmentResponse(results=results)
