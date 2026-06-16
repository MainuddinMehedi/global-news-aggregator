

# What it means for changes logged in admin dashboard md file. 
In the [[6. admin-dashboard]] file it mentions some changes in how we handle the main feed(pre configured rss) list and there are some changes that will be required for the admin dashboard task. 
So i think handling the core changes like source list(feed list) in db is a change not only for admin dashboard but for other places wherever we need to use the main sources list. eg. - ingestion pipeline, admin dashboard, user preference control setting from the frontend. 

we should avoid continuous changes as we progress. any changes it will bring in prisma and data flow should be addressed now. 

> also look for similar debt for anywhere i'm missing.  

