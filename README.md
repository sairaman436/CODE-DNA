# CODE DNA

**Technical identity, decoded from real code.**

Code DNA is a developer intelligence platform that analyzes GitHub repositories and turns source-code patterns into a living technical fingerprint. It looks beyond contribution counts and language badges to understand how a developer structures logic, handles complexity, writes tests, documents intent, and evolves code over time.

This is not a vanity dashboard. It is an analysis engine, a distributed worker system, and a profile experience built for serious developer discovery.

## What It Does

Code DNA connects to GitHub, discovers a developer's repositories, fetches selected source files, and produces an eight-axis coding fingerprint:

- Readability
- Complexity control
- Documentation quality
- Test mindset
- Commit discipline
- Language depth
- Refactor tendency
- Error handling

The result is a shareable developer profile with strengths, growth areas, language statistics, commit patterns, activity pulse, and a developer archetype.

## The Engine

The Python engine is built to behave like a distributed agent system.

- Repository work is split into adaptive batches.
- Multiple engine peers process work in parallel.
- Fast engines keep pulling pending work instead of waiting on slow batches.
- Medium and large repositories spawn internal file-analysis workers.
- GitHub API source fetching downloads selected analyzable files instead of entire repos.
- Archive and git clone paths remain as fallbacks.
- Watchdogs skip stuck repos, stuck file workers, and final straggler batches.
- Engine health exposes the active runtime settings.

In plain terms: one slow repository should not freeze the whole analysis.

## Architecture

```text
GitHub
  |
  v
Next.js Frontend
  |
  v
Node.js Backend
  |
  v
Python Engine Pool
  |-- Engine 8000
  |-- Engine 8001
  |-- Engine 8002
  |
  v
Webhook Results
  |
  v
Database + Profile UI
```

## Stack

- Frontend: Next.js 14, React, Tailwind CSS, Framer Motion
- Backend: Node.js, Express, Prisma
- Engine: Python, FastAPI, AST parsing, tree-sitter when available
- Auth: NextAuth with GitHub OAuth
- Database: Prisma-supported SQL database
- Runtime: Multi-engine local worker pool with production-style guardrails

## Engine Highlights

### Source Fetching

Default mode is API source fetch:

```text
GitHub tree API -> select useful source files -> download blobs in parallel -> analyze
```

This avoids downloading huge assets, build folders, vendored dependencies, and files the engine will never score.

### Adaptive Scheduling

Small GitHub accounts get tiny batches for fairness. Large accounts get larger dynamic work batches to avoid hundreds of HTTP calls while still keeping multiple engine waves active.

### Straggler Protection

The engine has watchdogs for:

- File analysis workers
- Repo workers
- Final repo stragglers
- Peer engine batches
- Final distributed engine tails

If one repo gets stuck, Code DNA logs it, skips it, and keeps the fingerprint moving.

## Run Locally

Install dependencies:

```bash
cd frontend && npm install
cd ../backend && npm install
cd ../engine && pip install -r requirements.txt
```

Start everything on Windows:

```powershell
.\start.bat
```

Start everything on macOS/Linux:

```bash
./start.sh
```

Local services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Engine 1: `http://localhost:8000`
- Engine 2: `http://localhost:8001`
- Engine 3: `http://localhost:8002`

Check an engine:

```bash
curl http://localhost:8000/health
```

## Important Environment Variables

Backend:

```env
DATABASE_URL=...
WEBHOOK_SECRET=...
GITHUB_TOKEN=...
ANALYSIS_SERVICE_URLS=http://localhost:8000,http://localhost:8001,http://localhost:8002
CODEDNA_ANALYSIS_GATEWAY_ENABLED=1
CODEDNA_GATEWAY_GITHUB_OWNER=sairaman436
CODEDNA_GATEWAY_GITHUB_REPO=CODE-DNA
CODEDNA_PUBLIC_ANALYSIS_RATE_MAX=8
CODEDNA_PUBLIC_ANALYSIS_RATE_WINDOW_MS=900000
CODEDNA_USER_ANALYSIS_RATE_MAX=4
CODEDNA_USER_ANALYSIS_RATE_WINDOW_MS=7200000
```

Frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_SECRET=...
GITHUB_ID=...
GITHUB_SECRET=...
```

Engine:

```env
CODEDNA_SOURCE_FETCH_MODE=api
CODEDNA_DISTRIBUTED_BATCH_SIZE=0
CODEDNA_MAX_REPO_WORKERS=2
CODEDNA_FILE_ANALYSIS_WORKERS=4
CODEDNA_API_FILE_FETCH_WORKERS=8
CODEDNA_FAST_FAIL_GITHUB_API_STATUSES=403,404,451
CODEDNA_TAIL_REPO_TIMEOUT_SECONDS=45
CODEDNA_DISTRIBUTED_TAIL_TIMEOUT_SECONDS=75
```

Repository discovery defaults:

```env
CODEDNA_INCLUDE_FORKS=1
CODEDNA_INCLUDE_ARCHIVED=1
CODEDNA_MAX_REPO_SIZE_KB=0
```

`CODEDNA_MAX_REPO_SIZE_KB=0` means no size cap.

## Public Gateway

Code DNA is public and free, but analysis is expensive. Non-admin users must pass a lightweight trust gate before the engine starts:

- Follow the configured GitHub creator account.
- Star the configured Code DNA repository.
- Stay inside public request and per-user analysis limits.

The analyzing page shows the missing gateway steps and lets users verify again after following/starring. Admins and the configured creator account bypass the gate.

## Verification

Run the production checks:

```bash
cd backend && npm test
cd ../engine && python -m unittest discover -s tests -v
python -m py_compile analyzer.py main.py
cd ../frontend && npx tsc --noEmit
```

## Production Notes

- Always configure `WEBHOOK_SECRET` in both backend and engine.
- Use authenticated GitHub tokens to avoid low public API rate limits.
- Scale engine ports horizontally behind `ANALYSIS_SERVICE_URLS`.
- Keep `.next` out of synced folders when possible; the dev script cleans stale Next cache before startup.
- Watch `/health` on each engine to confirm runtime settings.

## Why Code DNA Exists

GitHub shows what happened. Code DNA tries to show how a developer thinks.

It reads structure, pressure points, habits, and tradeoffs. It turns scattered repositories into a technical identity that other developers, teams, and recruiters can actually understand.

Built by Sairaman for developers who want their code to speak with more signal.
