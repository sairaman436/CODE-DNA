# CodeDNA Test Report

Date: 2026-05-25

## Summary

Added executable regression coverage for the backend API layer and Python analysis engine, then verified the frontend TypeScript surface. A second pass upgraded the engine hot path for faster GitHub repository analysis. A third pass added production guardrails for high-traffic behavior: bounded engine queueing, network timeouts, webhook authentication, and malformed result rejection.

## Tests Added

### Backend

Command: `npm test`

Result: 15 passing tests.

Files:

- `backend/tests/helpers.js`
- `backend/tests/auth.test.js`
- `backend/tests/github.test.js`
- `backend/tests/username.test.js`
- `backend/tests/webhook.test.js`

Covered cases:

- Auth registration required fields, GitHub email ownership rejection, OTP invalidation, GitHub user linking, mail-safe registration path.
- Login banned-user blocking, failed-attempt incrementing, security lockout after repeated failures.
- OTP verification consumes the OTP, marks the user verified, returns a safe user payload without password leakage.
- GitHub repository filtering excludes forks, archived repos, empty repos, learning repos, and hackathon repos.
- GitHub fetch uses token-authenticated endpoint correctly and caps eligible repositories to the 10 most recent.
- GitHub API failures are surfaced as errors.
- Username availability validates missing, malformed, reserved, duplicate, and available names.
- Username claiming validates bad format, reserved names, missing users, duplicate conflicts, cooldown, and successful lowercased claim.
- Webhook results reject missing payloads, save fingerprint details, save language/commit metadata, and update existing developer vectors.
- Webhook progress updates supplied progress/step fields.
- Webhook routes reject missing/invalid shared secrets when `WEBHOOK_SECRET` is configured.
- Webhook results reject malformed score contracts.
- GitHub API timeout handling aborts stalled requests.

### Engine

Command: `python -m unittest discover -s tests -v`

Result: 12 passing tests.

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

## Engine Performance Upgrades

- Replaced `--filter=blob:none` with `--filter blob:limit=200k`, so small source files are available locally after clone instead of triggering a network fetch per file read.
- Reduced clone depth from 50 to configurable `CODEDNA_CLONE_DEPTH=20` by default.
- Added `GIT_LFS_SKIP_SMUDGE=1` to avoid downloading large LFS assets during analysis.
- Added branch-aware cloning using repository `default_branch`.
- Added a shallow clone fallback if the Git server does not support partial clone filters.
- Reduced git log work to configurable `CODEDNA_GIT_LOG_LIMIT=50` and short `CODEDNA_GIT_TIMEOUT_SECONDS=12`.
- Limited activity pulse git log to the last 90 days.
- Bounded candidate scanning with `CODEDNA_MAX_CANDIDATE_FILES=2000`.
- Bounded scoring with `CODEDNA_MAX_FILES_TO_SCORE=80`.
- Skips files over `CODEDNA_MAX_FILE_BYTES=200000` before opening them.
- Replaced “largest 50 files” selection with representative source ranking by language, file size, tests, README, and project manifest files.
- Added configurable repo concurrency through `CODEDNA_MAX_REPO_WORKERS=6`.
- Added configurable engine job workers through `CODEDNA_ENGINE_WORKERS`, defaulting to at most 4.
- Redacted GitHub access tokens from clone error logs.

## Production Guardrails Added

- `WEBHOOK_SECRET`: optional shared secret enforced by backend webhook routes and sent by the engine. Configure the same value in backend and engine environments.
- `GITHUB_FETCH_TIMEOUT_MS`: caps GitHub API calls in the backend, default `10000`.
- `ENGINE_REQUEST_TIMEOUT_MS`: caps backend-to-engine dispatch requests, default `5000`.
- `CODEDNA_ENGINE_WORKERS`: caps concurrent engine process workers, default `min(cpu_count, 4)`.
- `CODEDNA_ENGINE_QUEUE_LIMIT`: caps queued/in-flight engine jobs, default `CODEDNA_ENGINE_WORKERS * 4`; overloaded requests return `503`.
- `/health` now exposes engine workers, queue limit, jobs in flight, and available cores.

### Frontend

Command: `npx tsc --noEmit`

Result: passed.

Covered cases:

- Full frontend TypeScript compile/type surface across Next.js app routes, components, auth declarations, store, and middleware.

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
