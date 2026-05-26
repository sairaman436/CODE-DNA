# Single-Server Pre-Deploy Checklist

Use this checklist before pressing start in Pterodactyl.

## Runtime

- The egg/container has NodeJS.
- The egg/container has npm.
- The egg/container has Python 3.
- The egg/container has pip.
- The server has enough RAM for frontend, backend, and three engine processes.

## Ports

- `FRONTEND_PORT=3000`
- `BACKEND_PORT=5000`
- `ENGINE_PORTS=8000,8001,8002`

All five ports should be allocated or reachable internally.

## GitHub

- `GITHUB_ID` and `GITHUB_SECRET` are from your GitHub OAuth app.
- GitHub callback URL points to:

```text
https://your-domain.com/api/auth/callback/github
```

- `GITHUB_TOKEN` is set to avoid public GitHub API limits.

## Mail

- Gmail account has 2-step verification enabled.
- `GMAIL_APP_PASSWORD` is an app password, not your normal Gmail password.
- `NEWSLETTER_TO_EMAIL` is where footer signup notifications should go.

## Secrets

- `WEBHOOK_SECRET` is long and random.
- `NEXTAUTH_SECRET` is long and random.
- `WEBHOOK_SECRET` is shared by backend and engine.

## Startup

Install:

```bash
bash deployment/pterodactyl/single-server/install.sh
```

Start:

```bash
bash deployment/pterodactyl/single-server/start.sh
```

## After Start

Open:

```text
https://your-domain.com
```

Check backend:

```text
https://api.your-domain.com/api/health
```

If backend is not on a separate public domain, check the mapped route from your reverse proxy.
