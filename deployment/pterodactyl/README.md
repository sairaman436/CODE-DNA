# CodeDNA Pterodactyl Deployment

This folder is for running CodeDNA on a Pterodactyl node with NodeJS and Python eggs.

Recommended layout:

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

This keeps everything on your own Pterodactyl machine, but still separates the Node and Python runtimes.

## Required Ports

Ask Pterodactyl for these allocations:

```text
NodeJS server:
  3000 - frontend
  5000 - backend

Python server:
  8000 - engine 1
  8001 - engine 2
  8002 - engine 3
```

If your panel gives only one public port per server, expose the frontend publicly and put the backend/engine behind a reverse proxy such as Nginx or Cloudflare Tunnel.

## NodeJS Server

Use a NodeJS egg for the frontend and backend.

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
- The SQLite database file lives in `backend/prisma/prod.db` when using `DATABASE_URL=file:./prod.db`.
- Back up `backend/prisma/prod.db` regularly.
- For high public usage, move from SQLite to Postgres later. SQLite is fine for first deployment, but Postgres is safer for many concurrent users.
- Keep the engine ports private if possible. The backend signs engine requests with `WEBHOOK_SECRET`, but private networking is still better.
