> Reviewing this file - [enrichment-pipeline](enrichment-pipeline.md)

`sourceOrigin` - Macro geopolitical bloc (e.g., Middle East, Europe)
If this metadata is meant to be representing the sources geopolitical bloc then do you think the naming is proper. It kind of doesn't give me the clue right away that this is the geo spatial coverage of the source. 

Isn't geological coverage is what it represent? for example, let's say - bdNews is a local news media. It covers the news happening in bangladesh. So that means the sourceOrigin is Bangladesh. 
through this example, do you see that the naming sourceOrigin isn't self explaining? 

If that's what is represent then it should be named something like - 
1. publisherCoverage
2. coverage
3. somehow telling whether it is local or global 

Oh no! Coverage scope already exists. then i don't understand what this sourceOrigin does. how it is helpful to the app. don't think it's required. 

---

And the group b table 
`eventRegion`
`categories`
`entities`
`sentimentScore`
Geographic region of the news event
Topics (e.g., geopolitics, economy, business)
Extracted actors (PERSON, ORG, GPE, LOC)
Reporting tone polarity (-1.0 to +1.0)


---

### Scope Boundaries
- **Micro-Batching:** To protect memory limits (512MB RAM constraints on the FastAPI service), articles are buffered and processed in batches of 30.
- **Graceful Degradation:** If the Python NLP service crashes or goes offline, Stage 2 yields empty entities/null sentiment, allowing ingestion to continue without blocking.


---

Check the dimentional matrix falsification(stage 2 nlp engine) ram footprint properly. ram footprint means here how much it takes to run and process. not the size of the model. spacy models ram footprint wrong. gliner and api is right. 
Check the test and report docs for ref.

And gemini 1.5 is never been discussed. it is not in the ai studio tier list. look into the ai models doc md file to get know the models available here. 
I updated it with groq / mistral / gemini. I will be talking about mistral in a minute and to update the ai model doc file. 

---

- **Stage 2 (Python FastAPI):** Runs spaCy (`en_core_web_sm`) and `vaderSentiment` over HTTP to extract named entities and compute sentiment.

NOTE that stage 2 is changing from micro service. Maybe we'll update it as we do but for now i note it.


