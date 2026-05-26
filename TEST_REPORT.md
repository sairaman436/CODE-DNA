# CodeDNA Test Report

Date: 2026-05-25

## Summary

Added executable regression coverage for the backend API layer and Python analysis engine, then verified the frontend TypeScript surface. Later passes upgraded the engine hot path, stabilized clone fallback behavior, added high-traffic guardrails for users with large GitHub accounts, introduced a multi-engine dispatch pool, and added distributed repo-batch fanout across peer engines.

## Tests Added

### Backend

Command: `npm test`

Result: 33 passing tests.

Files:

- `backend/tests/helpers.js`
- `backend/tests/auth.test.js`
- `backend/tests/github.test.js`
- `backend/tests/mailer.test.js`
- `backend/tests/newsletter.test.js`
- `backend/tests/settings.test.js`
- `backend/tests/username.test.js`
- `backend/tests/webhook.test.js`

Covered cases:

- Auth registration required fields, GitHub email ownership rejection, OTP invalidation, GitHub user linking, mail-safe registration path.
- Login banned-user blocking, failed-attempt incrementing, security lockout after repeated failures.
- Admin password logins require OTP instead of bypassing two-step verification.
- OTP verification consumes the OTP, marks the user verified, returns a safe user payload without password leakage.
- Settings password change verifies the current password, stores a fresh hash, resets lockout state, invalidates pending OTPs, and logs the change.
- Newsletter signup validates email addresses and sends both owner notification and subscriber confirmation emails.
- Production mail delivery uses Resend over HTTPS when `RESEND_API_KEY` is configured, including sender override, reply-to mapping, and comma-separated recipients.
- GitHub repository discovery includes every non-empty owner repository by default; optional env flags can exclude forks, archived repos, or oversized repos for constrained deployments.
- GitHub fetch uses token-authenticated endpoint correctly and returns every eligible repository.
- GitHub repository discovery keeps paging until GitHub is exhausted by default.
- Giant repositories are included by default for complete analysis.
- GitHub API failures are surfaced as errors.
- Username availability validates missing, malformed, reserved, duplicate, and available names.
- Username claiming validates bad format, reserved names, missing users, duplicate conflicts, cooldown, and successful lowercased claim.
- Webhook results reject missing payloads, save fingerprint details, save language/commit metadata, and update existing developer vectors.
- Webhook progress updates supplied progress/step fields.
- Webhook routes reject missing/invalid shared secrets when `WEBHOOK_SECRET` is configured.
- Webhook results reject malformed score contracts.
- GitHub API timeout handling aborts stalled requests.
- Backend dispatches analysis jobs across a comma-separated `ANALYSIS_SERVICE_URLS` engine pool with round-robin selection and failover.
- Analysis gateway requires non-admin users to follow the configured GitHub owner and star the configured repository before expensive engine work starts.
- Public in-memory request limiting blocks repeated analysis attempts from the same user/IP window.
- Staff, admins, the creator account, and the master admin email bypass analysis gateway and rate limits.

### Engine

Command: `python -m unittest discover -s tests -v`

Result: 29 passing tests.

Files:

- `engine/tests/test_analyzer.py`

Covered cases:

- Secret, generated, vendor, and build path skipping.
- Legitimate source paths are not skipped by broad `env` matching.
- Language detection for Python, TypeScript/TSX, unknown files.
- Test file detection for POSIX and Windows-style paths.
- Python AST analysis for functions, async functions, docstrings, nesting, and invalid syntax.
- Generic file analysis for comments, assertions, and error-handling patterns.
- Empty scoring input returns the same contract shape as real scoring input.
- Scores remain clamped within `0..100`.
- Empty repository analysis returns a stable zero-score profile instead of crashing.
- Developer classification boundary for `The Architect`.
- Fast clone command uses shallow partial clone with the default branch.
- Clone fallback path works when partial clone filters are unsupported.
- Engine webhook requests include the shared secret only when configured.
- Engine job slot reservation rejects overload and releases capacity.
- Partial clone fallback clears a dirty target directory before retrying.
- Oversized repositories are attempted by default; repo-size skipping is an optional deployment brake.
- Repository batches are balanced by repo size before distribution.
- Coordinator engines dispatch repo batches to peer engines and merge raw results into one fingerprint.
- Engine service uses `ThreadPoolExecutor` for I/O-bound analysis to avoid Windows multiprocessing overhead.
- GitHub API source-file fetch is the default path, with archive and git clone fallbacks.
- GitHub API source-file fetch downloads only selected analyzable source files and skips vendor/assets before download.
- GitHub API hard failures such as 403 fail fast for that repo instead of burning the full repo watchdog on slower fallbacks.
- Archive extraction is path-safe and does not allow zip entries to escape the temp directory.
- Distributed analysis uses dynamic micro-batches so fast engines keep taking pending repositories instead of waiting on static slow batches.
- Distributed batch size auto-scales by repository count and engine count when `CODEDNA_DISTRIBUTED_BATCH_SIZE=0`.
- Medium/big repositories spawn internal file-analysis workers so selected files are analyzed in parallel.
- Repo and file worker watchdogs prevent stuck analysis units from blocking the whole engine indefinitely.
- Tail watchdogs cut off the final stuck repository or engine batch so re-analysis does not sit at the last remaining unit.
- Distributed tail shutdown no longer waits on a stuck local engine thread after deciding to skip the final batch.

## Engine Performance Upgrades

- Replaced `--filter=blob:none` with `--filter blob:limit=200k`, so small source files are available locally after clone instead of triggering a network fetch per file read.
- Replaced whole-repository downloading as the default path with GitHub API tree/blob fetching, so analysis downloads selected source files instead of entire repos.
- Kept `zipball` archive download and git clone as fallbacks when API source-file fetching cannot be used.
- Fast-fails GitHub API hard rejection statuses before archive/git fallback to avoid 180-second waits on blocked repos.
- Replaced static three-way engine splitting with dynamic engine work scheduling to reduce slow-tail batch delays.
- Added adaptive distributed batch sizing so users with many repositories get larger dynamic batches while smaller profiles keep one-repo micro-batches.
- Added repo-local file analysis workers for medium/big repos, matching the engine-agent model inside a single repository.
- Added repo/file watchdog deadlines with explicit stuck-worker logs so analysis can continue instead of freezing mid-run.
- Added final-tail watchdogs for the “last repo/last batch is stuck” re-analysis case.
- Reduced clone depth from 50 to configurable `CODEDNA_CLONE_DEPTH=20` by default.
- Reduced default archive and clone timeout windows so one bad repository cannot block a worker for several minutes before fallback.
- Added `GIT_LFS_SKIP_SMUDGE=1` to avoid downloading large LFS assets during analysis.
- Added branch-aware cloning using repository `default_branch`.
- Added a shallow clone fallback if the Git server does not support partial clone filters.
- Reduced git log work to configurable `CODEDNA_GIT_LOG_LIMIT=50` and short `CODEDNA_GIT_TIMEOUT_SECONDS=12`.
- Limited activity pulse git log to the last 90 days.
- Bounded candidate scanning with `CODEDNA_MAX_CANDIDATE_FILES=2000`.
- Bounded scoring with `CODEDNA_MAX_FILES_TO_SCORE=80`.
- Skips files over `CODEDNA_MAX_FILE_BYTES=200000` before opening them.
- Analyzes all repositories by default; `CODEDNA_MAX_REPO_SIZE_KB` can optionally cap clone size for constrained deployments.
- Replaced “largest 50 files” selection with representative source ranking by language, file size, tests, README, and project manifest files.
- Added configurable repo concurrency through `CODEDNA_MAX_REPO_WORKERS=6`.
- Added configurable engine job workers through `CODEDNA_ENGINE_WORKERS`, defaulting to 2 threaded workers.
- Added per-repository fetch/analyze timing logs to identify the exact slow repository and stage.
- Engine `/health` now reports active source fetch mode, distributed batch size, API file workers, and repo worker count for runtime verification.
- Redacted GitHub access tokens from clone error logs.

## Production Guardrails Added

- `WEBHOOK_SECRET`: optional shared secret enforced by backend webhook routes and sent by the engine. Configure the same value in backend and engine environments.
- `ANALYSIS_SERVICE_URLS`: comma-separated engine pool, e.g. `http://localhost:8000,http://localhost:8001,http://localhost:8002`.
- `CODEDNA_ANALYSIS_GATEWAY_ENABLED`: enables the star/follow analysis gate, default enabled.
- `CODEDNA_GATEWAY_GITHUB_OWNER`: GitHub account users must follow, default `sairaman436`.
- `CODEDNA_GATEWAY_GITHUB_REPO`: repository users must star, default `CODE-DNA`.
- `CODEDNA_PUBLIC_ANALYSIS_RATE_MAX`: max public attempts per user/IP window, default `8`.
- `CODEDNA_PUBLIC_ANALYSIS_RATE_WINDOW_MS`: public rate-limit window, default `900000`.
- `CODEDNA_USER_ANALYSIS_RATE_MAX`: max saved analysis jobs per user window, default `4`.
- `CODEDNA_USER_ANALYSIS_RATE_WINDOW_MS`: saved analysis job rate-limit window, default `7200000`.
- `CODEDNA_ENGINE_PEER_URLS`: comma-separated peer engine pool used by a coordinator engine to split one user's repos across multiple engines.
- `CODEDNA_ENGINE_SELF_URL`: current engine URL, used to avoid dispatching a remote batch back to itself.
- `CODEDNA_DISTRIBUTED_BATCH_SIZE`: repositories per dynamic distributed work batch, default `0` for automatic per-user sizing.
- `CODEDNA_SOURCE_FETCH_MODE`: source fetch strategy, default `api`; set to `archive` or `git` to force older fetch paths.
- `CODEDNA_FAST_FAIL_GITHUB_API_STATUSES`: comma-separated GitHub API statuses that should skip slow fallbacks, default `403,404,451`.
- `CODEDNA_INCLUDE_FORKS`: include forked repositories by default; set `0` to exclude forks.
- `CODEDNA_INCLUDE_ARCHIVED`: include archived repositories by default; set `0` to exclude archived repositories.
- `CODEDNA_API_FILE_FETCH_WORKERS`: concurrent GitHub blob downloads for API source fetch, default `8`.
- `CODEDNA_FILE_ANALYSIS_WORKERS`: internal workers for medium/big repo file analysis, default `4`.
- `CODEDNA_FILE_ANALYSIS_PARALLEL_THRESHOLD`: selected-file count where a repo spawns file-analysis workers, default `20`.
- `CODEDNA_FILE_ANALYSIS_TIMEOUT_SECONDS`: max wait for repo-local file workers, default `45`.
- `CODEDNA_REPO_ANALYSIS_TIMEOUT_SECONDS`: max wait for one engine batch's repo workers, default `180`.
- `CODEDNA_TAIL_REPO_TIMEOUT_SECONDS`: max wait when only the final repo worker remains, default `45`.
- `CODEDNA_DISTRIBUTED_TAIL_TIMEOUT_SECONDS`: max wait when only the final distributed engine batch remains, default `75`.
- `CODEDNA_PEER_BATCH_TIMEOUT_SECONDS`: max wait for a peer engine batch, default `240`.
- `CODEDNA_ARCHIVE_FETCH_TIMEOUT_SECONDS`: caps GitHub archive downloads, default `30`.
- `CODEDNA_CLONE_TIMEOUT_SECONDS`: caps each git clone attempt, default `45`.
- `GITHUB_FETCH_TIMEOUT_MS`: caps GitHub API calls in the backend, default `10000`.
- `GITHUB_MAX_REPO_PAGES`: optional cap for GitHub repository pages fetched, default `0` for no cap.
- `ENGINE_REQUEST_TIMEOUT_MS`: caps backend-to-engine dispatch requests, default `5000`.
- `CODEDNA_MAX_REPO_SIZE_KB`: optional giant-repo skip, default `0` for no size cap.
- `CODEDNA_ENGINE_WORKERS`: caps concurrent engine thread workers, default `2`.
- `CODEDNA_ENGINE_QUEUE_LIMIT`: caps queued/in-flight engine jobs, default `CODEDNA_ENGINE_WORKERS * 4`; overloaded requests return `503`.
- `/health` now exposes engine workers, queue limit, jobs in flight, and available cores.

### Frontend

Command: `npx tsc --noEmit`

Result: passed.

Covered cases:

- Full frontend TypeScript compile/type surface across Next.js app routes, components, auth declarations, store, and middleware.
- Analysis screen now presents engine-agent phases and live signal lanes instead of plain repository counters.
- Backend and engine progress copy now describes active analysis phases without mechanical `x/y repo` status text.

## Bugs Fixed During Testing

- `engine/analyzer.py`: empty or fully-filtered analysis now returns both `scores` and `patterns`, preventing `perform_full_analysis` from crashing on no analyzable repositories.
- `engine/analyzer.py`: test-file detection now supports Windows path separators.
- `engine/analyzer.py`: generated/vendor skipping no longer treats broad substrings like `env` as a reason to skip legitimate files such as `environment.ts`.
- `engine/analyzer.py`: docstring detection now uses `ast.get_docstring`, which works on Python versions where `ast.Str` is removed.
- `engine/main.py`: Pydantic v2 request serialization now uses `model_dump()`.
- `backend/package.json`: `npm test` now runs the backend Node test suite.

## Agent Inspection Findings To Prioritize Next

- Backend webhook endpoints are protected when `WEBHOOK_SECRET` is configured.
- Backend admin routes trust raw `x-user-id`; knowing an admin ID is enough to call privileged routes.
- Backend GitHub link and force-link endpoints are unauthenticated and can attach identities by email/GitHub ID.
- Backend username claim trusts `user_id` or `github_id` in the request body.
- Frontend badge SVG route interpolates user-controlled text into SVG without escaping.
- Frontend several fetch paths assume error responses are JSON.
- Frontend profile/settings averages can produce `NaN` when radar/language arrays are empty.
- Frontend lint still reports warnings around unused imports/vars, hook dependencies, raw images, and missing alt text.

## Verification Commands

```bash
cd backend && npm test
cd engine && python -m unittest discover -s tests -v
cd engine && python -m py_compile analyzer.py main.py
cd frontend && npx tsc --noEmit
```

All verification commands passed after the changes above.
