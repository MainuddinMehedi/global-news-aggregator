# Suggestion on your docs folder organization.
You created a feature folder making a file for each feature and writing the whole overview of that feature in that file. 
But my intention was to create a index or outline file for each feature. for example admin dashboard or story-clustering file now contains everything about the feature. 
And i don't have a scope to reference newer researches and everything. 

so my suggestion for you is to add a section in the top after the feature id quote for references where i can link everything related to this feature right in there for keeping feature specific files connected and easier discovery. 

i know my intention might not be clear to you. so feel free to ask question. 

---

- Also i have updated the naming pattern. I use numbers for ordering the files. it becomes easier for me to find the index right away. So in any case you create files or organize this docs folder and have items of priorities order them with numbers. 

- Check if the [project_state](project_state.md) is required or if even relevant. i guess we can delete it. 
	I use [PROJECT STATUS AND ToDo's](PROJECT%20STATUS%20AND%20ToDo's.md) for the project's current condition and next things tracking.


- I need TOC - table of content in all files. (avoid the dumps - when a doc is not highly relevant anymore but still want to keep it will go to the archive_dump directory and the links of that will be removed).



# What it means for changes logged in admin dashboard md file. 
In the admin dashboard file it mentions some changes in how we handle the main feed list and there are some changes that will be required for the admin dashboard task. 
So i think handling the core changes like source list(feed list) in db is a change not only for admin dashboard but for other places wherever we need to use the main sources list. eg. - ingestion pipeline, admin dashboard, user preference control setting from the frontend. 

so even if we're focused on something else right now we should approach structurally to avoid continuous changes as we progress. 

> also look for similar debt for anywhere i'm missing.  

