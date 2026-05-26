# Pterodactyl Upload Manifest

Upload the repository code, not local runtime junk.

## Upload These

```text
backend/
frontend/
engine/
deployment/pterodactyl/
README.md
TEST_REPORT.md
docker-compose.yml
start.bat
start.sh
```

The important production startup files are:

```text
deployment/pterodactyl/single-server/install.sh
deployment/pterodactyl/single-server/start.sh
deployment/pterodactyl/single-server/.env.example
```

## Do Not Upload These

```text
backend/.env
backend/prisma/dev.db
backend/prisma/prod.db
frontend/.env.local
frontend/.next/
frontend/node_modules/
backend/node_modules/
engine/__pycache__/
engine/.venv/
.git/
```

Do not upload real secrets in files. Put secrets into Pterodactyl environment variables.

## Single-Server Pterodactyl Command

Startup command:

```bash
bash deployment/pterodactyl/single-server/start.sh
```

The startup command installs and builds on first run, then starts everything. If you upload new code later and need to reinstall dependencies/rebuild, set `CODEDNA_FORCE_INSTALL=1` for one restart.

## Required Environment Variables

Minimum required variables:

```env
PUBLIC_FRONTEND_URL=https://your-domain.com
PUBLIC_BACKEND_URL=https://api.your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
CODEDNA_CORS_ORIGINS=https://your-domain.com
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

For local engine routing inside the same Pterodactyl server:

```env
CODEDNA_BACKEND_URL=http://127.0.0.1:5000
ANALYSIS_SERVICE_URLS=http://127.0.0.1:8000,http://127.0.0.1:8001,http://127.0.0.1:8002
CODEDNA_ENGINE_PEER_URLS=http://127.0.0.1:8000,http://127.0.0.1:8001,http://127.0.0.1:8002
```

## Port Allocations

Ask for these allocations:

```text
3000 - frontend
5000 - backend
8000 - engine 1
8001 - engine 2
8002 - engine 3
```

If only one public port is available, expose the frontend and route backend/engine through a reverse proxy or tunnel.
