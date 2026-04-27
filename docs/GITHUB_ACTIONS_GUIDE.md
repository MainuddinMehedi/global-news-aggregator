# 🚀 GitHub Actions: Ingestion Automation Guide

I have implemented two automated workflows to handle your news ingestion and backlog processing. This system will now run entirely in the cloud without you needing to keep a terminal or server open.

## 🛠️ How it works

1.  **News Ingestion (`ingest.yml`)**: 
    - **Trigger**: Runs every **30 minutes** automatically.
    - **Purpose**: Fetches the latest RSS feeds and processes the first 20 new articles with AI.
    - **Manual Run**: You can trigger this anytime from the GitHub "Actions" tab if you want to force an update.

2.  **Daily Backlog (`backlog.yml`)**:
    - **Trigger**: Runs once a day at **3:00 AM UTC**.
    - **Purpose**: Checks for any articles that were saved but not yet processed by AI (e.g., if you hit a rate limit or ran in `--skip-ai` mode earlier). It processes up to 100 articles per run.

---

## 🔑 Your Next Procedures (Crucial)

GitHub Actions cannot see your local `.env` file. You **MUST** add your environment variables to GitHub as "Secrets" for this to work.

### Step 1: Add Secrets to GitHub
1.  Go to your repository on GitHub.com.
2.  Navigate to **Settings** > **Secrets and variables** > **Actions**.
3.  Click **New repository secret** for EACH of the following (copy values from your local `.env`):

| Secret Name | Description / Value |
| :--- | :--- |
| `DATABASE_URL` | Your Supabase connection string |
| `AI_PRIMARY_API_KEY` | Your Groq API Key |
| `AI_PRIMARY_MODEL` | `meta-llama/llama-4-scout-17b-16e-instruct` |
| `AI_PRIMARY_PROVIDER` | `groq` |
| `AI_PRIMARY_BASE_URL` | `https://api.groq.com/openai/v1` |
| `AI_TPM_LIMIT` | `25000` (or your plan limit) |
| `AI_RPM_LIMIT` | `28` (or your plan limit) |

> [!TIP]
> You can also add the optional ones like `AI_FALLBACK_API_KEY`, `AI_BATCH_SIZE`, etc., if you want to override the defaults in the cloud.

### Step 2: Push the Changes
Since I've created the files locally, you need to commit and push them to your GitHub repository:
```bash
git add .github/workflows/*.yml
git commit -m "feat: add github actions for ingestion and backlog"
git push origin main
```

### Step 3: Test the Workflow
1.  Once pushed, go to the **Actions** tab on GitHub.
2.  Select **News Ingestion Pipeline** from the left sidebar.
3.  Click the **Run workflow** dropdown button on the right.
4.  Click the green **Run workflow** button.
5.  Watch the logs! You will see the pipeline installing dependencies, generating Prisma, and running your ingestion script.

---

## 📊 Monitoring & Debugging

- **Green Checkmark ✅**: Ingestion was successful.
- **Red X ❌**: Something went wrong. Click on the failed run to see the logs. Usually, this is due to a missing Secret or a database connection timeout.
- **Artifacts**: You can see how many tokens were used and which articles were inserted directly in your database or by checking the action logs.

---

## ❓ FAQ

**Q: Will this cost money?**
A: GitHub Actions is free for 2,000 minutes/month for private repos (unlimited for public). Your ingestion script takes about 1-2 minutes per run, so it should easily stay within the free tier.

**Q: What if I want to change the frequency?**
A: Edit the `cron` line in `.github/workflows/ingest.yml`. 
- `*/30 * * * *` means every 30 minutes.
- `0 * * * *` means every hour.
