# Code DNA - Zero-Cost Permanent Deployment Strategy

This document outlines the architectural strategy to host the **Code DNA** platform 100% for free, permanently, avoiding 30-day trial expirations and compute hour limits.

> [!WARNING]
> **Immediate Action Required (The 30-Day Danger)**
> Render's free PostgreSQL databases automatically expire and delete all data after exactly 30 days. To prevent permanent data loss, the database must be migrated to a permanent free-tier provider before the 30-day window closes.

> [!IMPORTANT]
> **The 750-Hour Compute Limit**
> Render provides 750 free compute hours per month per account. A single web service running 24/7 consumes 744 hours. Running two services (Node.js Backend + Python Engine) simultaneously will burn through your free hours halfway through the month, causing both services to shut down until the next billing cycle.

---

## 🏗️ The Ultimate Free Architecture

To solve these limits, we distribute the application's components across specialized free-tier providers.

### 1. Frontend (Next.js)
* **Host:** [Vercel](https://vercel.com/)
* **Cost:** 100% Free Permanently
* **Why:** Vercel created Next.js. Their free tier is extremely generous, permanent, and optimized specifically for Next.js applications with zero cold-start issues for static assets.

### 2. Database (PostgreSQL)
* **Host:** [Neon.tech](https://neon.tech/) or [Supabase](https://supabase.com/)
* **Cost:** 100% Free Permanently
* **Why:** Both offer serverless PostgreSQL with generous free tiers that never expire. This permanently resolves the Render 30-day deletion risk. Neon is particularly great for raw Postgres connections.

### 3. Python AI Engine (FastAPI)
* **Host:** [Hugging Face Spaces](https://huggingface.co/spaces)
* **Cost:** 100% Free Permanently
* **Why:** The Python engine is resource-intensive. Hugging Face Spaces allows you to host Python/AI Docker containers completely for free. It is designed precisely for heavy machine learning and text-analysis workloads and will not eat into your Render compute hours.

### 4. Node.js Backend (Express)
* **Host:** Keep on [Render](https://render.com/) (or move to [Koyeb](https://www.koyeb.com/))
* **Cost:** 100% Free
* **Why:** By moving the database and Python engine elsewhere, your Node.js backend becomes the *only* thing running on your Render account. Your 750 free hours will easily cover the entire month, meaning your backend will never run out of time or get paused mid-month.

---

## 🚀 Migration Roadmap

When you are ready to migrate, follow these steps in order:

1. **Database Migration**
   - Create a free account on Neon.tech.
   - Run the Prisma schema migrations (`npx prisma db push`) against the new Neon database URL.
   - Update the `DATABASE_URL` environment variable in the Render Backend to point to Neon.

2. **Python Engine Migration**
   - Create a free account on Hugging Face.
   - Create a new "Docker Space".
   - Upload the `engine/` folder contents and ensure the `Dockerfile` exposes port 7860.
   - Set the `WEBHOOK_SECRET` environment variable in the Space settings.

3. **Backend Reconfiguration**
   - Update the Render Backend's environment variable `ANALYSIS_SERVICE_URL` to point to your new Hugging Face Space URL.
   - Delete the old Python Engine service and PostgreSQL database from your Render dashboard to save resources.

> [!TIP]
> By completing this roadmap, Code DNA will achieve true serverless zero-cost scalability, capable of running indefinitely without any monthly maintenance fees!
