# CodeDNA Pterodactyl Deployment

This folder is for running CodeDNA on a Pterodactyl node.

Best layout if your Pterodactyl egg/container has both NodeJS and Python:

```text
One Pterodactyl server
  - Next.js frontend on port 3000
  - Express backend on port 5000
  - FastAPI engine on port 8000
  - FastAPI engine on port 8001
  - FastAPI engine on port 8002
  - Prisma SQLite database
```

Fallback layout if your panel only gives separate NodeJS and Python eggs:

```text
Pterodactyl NodeJS server
  - Next.js frontend
  - Express backend
  - Prisma SQLite database

Pterodactyl Python server
  - FastAPI engine on port 8000
  - FastAPI engine on port 8001
  - FastAPI engine on port 8002
```

Both layouts keep everything on your own Pterodactyl machine. Use the single-server layout first if your egg supports both runtimes.

## Upload Guide

If you want one simple upload folder, generate it with:

```powershell
powershell -ExecutionPolicy Bypass -File deployment/pterodactyl/prepare-deploy-folder.ps1
```

That creates:

```text
deployment/pterodactyl/CODE-DNA-PTERODACTYL/
```

Upload that whole generated folder to Pterodactyl.

Before uploading to Pterodactyl, read:

```text
deployment/pterodactyl/UPLOAD_MANIFEST.md
deployment/pterodactyl/.deployignore
```

In short, upload the app code:

```text
backend/
frontend/
engine/
deployment/pterodactyl/
README.md
TEST_REPORT.md
```

Do not upload local secrets, `node_modules`, `.next`, Python cache files, or local SQLite dev databases.

## Required Ports

Ask Pterodactyl for these allocations:

```text
Single server:
  3000 - frontend
  5000 - backend
  8000 - engine 1
  8001 - engine 2
  8002 - engine 3
```

If your panel gives only one public port per server, expose the frontend publicly and put the backend/engine behind a reverse proxy such as Nginx or Cloudflare Tunnel.

## Single Server

Use this when your Pterodactyl server can run both NodeJS and Python.

Before starting, check:

```text
deployment/pterodactyl/single-server/PRE_DEPLOY_CHECKLIST.md
```

Set the startup command:

```bash
bash deployment/pterodactyl/single-server/start.sh
```

Recommended install command:

```bash
bash deployment/pterodactyl/single-server/install.sh
```

Environment variables:

```env
NODE_ENV=production
PYTHONUNBUFFERED=1
FRONTEND_PORT=3000
BACKEND_PORT=5000
ENGINE_HOST=0.0.0.0
ENGINE_PORTS=8000,8001,8002
PUBLIC_FRONTEND_URL=https://your-domain.com
PUBLIC_BACKEND_URL=https://api.your-domain.com
DATABASE_URL=file:./prod.db
WEBHOOK_SECRET=change-this-long-random-secret
NEXTAUTH_SECRET=change-this-long-random-secret
GITHUB_TOKEN=github_pat_or_token
GITHUB_ID=github_oauth_client_id
GITHUB_SECRET=github_oauth_client_secret
GMAIL_USER=your-gmail-address@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
NEWSLETTER_TO_EMAIL=your-gmail-address@gmail.com
CODEDNA_PUBLIC_SITE_URL=https://your-domain.com
```

The single-server script automatically wires:

```env
ANALYSIS_SERVICE_URLS=http://127.0.0.1:8000,http://127.0.0.1:8001,http://127.0.0.1:8002
CODEDNA_BACKEND_URL=http://127.0.0.1:5000
CODEDNA_ENGINE_PEER_URLS=http://127.0.0.1:8000,http://127.0.0.1:8001,http://127.0.0.1:8002
```

## NodeJS Server

Use this fallback only if you need separate NodeJS and Python Pterodactyl servers. The NodeJS server runs the frontend and backend.

Set the startup command:

```bash
bash deployment/pterodactyl/node/start.sh
```

Recommended install command:

```bash
bash deployment/pterodactyl/node/install.sh
```

Environment variables:

```env
NODE_ENV=production
FRONTEND_PORT=3000
BACKEND_PORT=5000
PUBLIC_FRONTEND_URL=https://your-domain.com
PUBLIC_BACKEND_URL=https://api.your-domain.com
DATABASE_URL=file:./prod.db
WEBHOOK_SECRET=change-this-long-random-secret
GITHUB_TOKEN=github_pat_or_token
GITHUB_ID=github_oauth_client_id
GITHUB_SECRET=github_oauth_client_secret
NEXTAUTH_SECRET=change-this-long-random-secret
GMAIL_USER=your-gmail-address@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
NEWSLETTER_TO_EMAIL=your-gmail-address@gmail.com
CODEDNA_PUBLIC_SITE_URL=https://your-domain.com
ANALYSIS_SERVICE_URLS=http://your-python-server-ip:8000,http://your-python-server-ip:8001,http://your-python-server-ip:8002
CODEDNA_CORS_ORIGINS=https://your-domain.com
CODEDNA_ANALYSIS_GATEWAY_ENABLED=1
CODEDNA_GATEWAY_GITHUB_OWNER=sairaman436
CODEDNA_GATEWAY_GITHUB_REPO=CODE-DNA
```

If frontend and backend share the same public domain through a reverse proxy, set:

```env
PUBLIC_BACKEND_URL=https://your-domain.com
CODEDNA_CORS_ORIGINS=https://your-domain.com
```

## Python Engine Server

Use a Python egg for the engine pool.

Set the startup command:

```bash
bash deployment/pterodactyl/python/start.sh
```

Recommended install command:

```bash
bash deployment/pterodactyl/python/install.sh
```

Environment variables:

```env
PYTHONUNBUFFERED=1
ENGINE_HOST=0.0.0.0
ENGINE_PORTS=8000,8001,8002
CODEDNA_BACKEND_URL=https://api.your-domain.com
WEBHOOK_SECRET=change-this-long-random-secret
CODEDNA_ENGINE_PEER_URLS=http://your-python-server-ip:8000,http://your-python-server-ip:8001,http://your-python-server-ip:8002
CODEDNA_SOURCE_FETCH_MODE=api
CODEDNA_DISTRIBUTED_BATCH_SIZE=0
CODEDNA_MAX_REPO_WORKERS=2
CODEDNA_FILE_ANALYSIS_WORKERS=4
CODEDNA_API_FILE_FETCH_WORKERS=8
CODEDNA_FAST_FAIL_GITHUB_API_STATUSES=403,404,451
CODEDNA_TAIL_REPO_TIMEOUT_SECONDS=45
CODEDNA_DISTRIBUTED_TAIL_TIMEOUT_SECONDS=75
```

## GitHub OAuth

In your GitHub OAuth app, set:

```text
Homepage URL:
https://your-domain.com

Authorization callback URL:
https://your-domain.com/api/auth/callback/github
```

If your frontend runs on a port, include it:

```text
https://your-domain.com:3000/api/auth/callback/github
```

## Production Notes

- Use strong random values for `WEBHOOK_SECRET` and `NEXTAUTH_SECRET`.
- Keep `WEBHOOK_SECRET` identical in NodeJS and Python servers.
- Gmail requires an app password for SMTP. Enable 2-step verification on the Gmail account, create an app password, and put it in `GMAIL_APP_PASSWORD`.
- The SQLite database file lives in `backend/prisma/prod.db` when using `DATABASE_URL=file:./prod.db`.
- Back up `backend/prisma/prod.db` regularly.
- For high public usage, move from SQLite to Postgres later. SQLite is fine for first deployment, but Postgres is safer for many concurrent users.
- Keep the engine ports private if possible. The backend signs engine requests with `WEBHOOK_SECRET`, but private networking is still better.
