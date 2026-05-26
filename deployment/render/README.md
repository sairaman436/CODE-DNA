# CodeDNA Render Deployment

Use Render as three web services plus one Postgres database:

```text
codedna-db        Render Postgres
codedna-backend   Node/Express/Prisma
codedna-engine    Python/FastAPI
codedna-frontend  Next.js
```

## 1. Database

Create a Render Postgres database first.

Copy the `Internal Database URL` from the database `Connect` tab and use it only as an environment variable:

```env
DATABASE_URL=postgresql://...
```

Do not commit or paste the full value into GitHub.

## 2. Backend

Create a Render Web Service.

```text
Name: codedna-backend
Root Directory: backend
Build Command: npm ci && npx prisma generate && npx prisma db push
Start Command: node src/index.js
```

Environment variables:

```env
DATABASE_URL=<Render Internal Database URL>
WEBHOOK_SECRET=<same long random secret used by engine>
GITHUB_TOKEN=<GitHub token>
ANALYSIS_SERVICE_URLS=https://codedna-engine.onrender.com
CODEDNA_CORS_ORIGINS=https://codedna-frontend.onrender.com
CODEDNA_PUBLIC_SITE_URL=https://codedna-frontend.onrender.com
CODEDNA_ANALYSIS_GATEWAY_ENABLED=1
CODEDNA_GATEWAY_GITHUB_OWNER=sairaman436
CODEDNA_GATEWAY_GITHUB_REPO=CODE-DNA
RESEND_API_KEY=<Resend API key>
MAIL_FROM=Code DNA <onboarding@resend.dev>
NEWSLETTER_TO_EMAIL=<owner inbox>
```

Note: Render free web services can block SMTP ports, so production mail should use `RESEND_API_KEY`. Gmail SMTP remains available only as a local/development fallback with `GMAIL_USER` and `GMAIL_APP_PASSWORD`.

## 3. Engine

Create a Render Web Service.

```text
Name: codedna-engine
Root Directory: engine
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Environment variables:

```env
PYTHON_VERSION=3.11.11
CODEDNA_BACKEND_URL=https://codedna-backend-rojy.onrender.com
WEBHOOK_SECRET=<same value as backend>
CODEDNA_SOURCE_FETCH_MODE=api
CODEDNA_DISTRIBUTED_BATCH_SIZE=0
CODEDNA_MAX_REPO_WORKERS=2
CODEDNA_FILE_ANALYSIS_WORKERS=4
CODEDNA_API_FILE_FETCH_WORKERS=8
CODEDNA_FAST_FAIL_GITHUB_API_STATUSES=403,404,451
```

After the engine URL is live, set the backend `ANALYSIS_SERVICE_URLS` to that engine URL.

## 4. Frontend

Create a Render Web Service.

```text
Name: codedna-frontend
Root Directory: frontend
Build Command: npm ci && npm run build
Start Command: npm run start -- --hostname 0.0.0.0 --port $PORT
```

Environment variables:

```env
NEXT_PUBLIC_API_URL=https://codedna-backend-rojy.onrender.com
NEXTAUTH_URL=https://codedna-frontend.onrender.com
NEXTAUTH_SECRET=<long random secret>
GITHUB_ID=<GitHub OAuth client id>
GITHUB_SECRET=<GitHub OAuth client secret>
GITHUB_CLIENT_ID=<same value as GITHUB_ID>
GITHUB_CLIENT_SECRET=<same value as GITHUB_SECRET>
```

## 5. GitHub OAuth

In your GitHub OAuth app:

```text
Homepage URL:
https://codedna-frontend.onrender.com

Authorization callback URL:
https://codedna-frontend.onrender.com/api/auth/callback/github
```

## 6. Deploy Order

1. Create Postgres.
2. Deploy backend with `DATABASE_URL`.
3. Deploy engine with `CODEDNA_BACKEND_URL`.
4. Update backend `ANALYSIS_SERVICE_URLS` to the engine URL.
5. Deploy frontend with backend URL.
6. Update backend `CODEDNA_CORS_ORIGINS` to the frontend URL.
