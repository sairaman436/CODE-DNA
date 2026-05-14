# Code DNA — Developer Fingerprint Analyzer
## Complete Project Blueprint

> **What it is:** A platform that analyzes any developer's GitHub profile and generates their unique "coding DNA" — a visual fingerprint of their patterns, personality, strengths, and blind spots. Think Myers-Briggs, but built entirely from your code.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Full Tech Stack](#2-full-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [All Pages — Detailed Breakdown](#4-all-pages--detailed-breakdown)
5. [Sprint Plan (AI-Assisted Timeline)](#5-sprint-plan-ai-assisted-timeline)
6. [Core Features — MVP](#6-core-features--mvp)
7. [v2 Features — Growth](#7-v2-features--growth)
8. [v3 Features — SaaS Monetisation](#8-v3-features--saas-monetisation)
9. [Database Schema](#9-database-schema)
10. [API Endpoints](#10-api-endpoints)
11. [How the Fingerprint Engine Works](#11-how-the-fingerprint-engine-works)
12. [Deployment Setup](#12-deployment-setup)
13. [Launch Strategy](#13-launch-strategy)

---

## 1. Project Overview

### The Core Idea
Every developer has unconscious habits baked into their code — naming conventions, how they structure functions, whether they comment before or after writing logic, how they phrase commit messages, what time of day they code best, and what languages they *think* they know vs what their actual commits show. No tool has ever surfaced all of this in one place as a visual identity.

**Code DNA** is the first developer identity platform built entirely from code analysis.

### Why This Will Get You an Internship
- It's technically complex (ML + AST parsing + D3 visualisations + WebSockets)
- It's genuinely useful to every developer alive
- It's shareable like Spotify Wrapped → goes viral naturally
- You can pull up an interviewer's GitHub during the interview and show them their own DNA report live
- It can become a real SaaS product with a clear monetisation path

### Unique Selling Points
- Nobody has built **identity profiling from code style** at this depth
- The shareable DNA card is the viral growth engine
- Teammate matching via vector similarity is technically impressive and actually useful
- The "blind spot" detector (skills you claim vs skills your code proves) is controversial enough to be talked about

---

## 2. Full Tech Stack

### Frontend
| Tool | Purpose |
|------|---------|
| Next.js 14 (App Router) | Core framework, SSR, routing |
| TypeScript | Type safety everywhere |
| Tailwind CSS | Styling |
| shadcn/ui | Pre-built accessible components |
| D3.js | All custom visualisations (radar, heatmap, bars) |
| Framer Motion | Page transitions and card animations |
| Satori + Sharp | Server-side OG image generation for DNA cards |
| NextAuth.js | GitHub OAuth session management |
| SWR | Data fetching + caching on the client |
| Zustand | Lightweight global state management |

### Backend
| Tool | Purpose |
|------|---------|
| Node.js + Express | Main API server |
| Python + FastAPI | AST analysis microservice |
| Prisma ORM | Database access layer |
| BullMQ | Job queue for async GitHub analysis |
| Redis | Queue broker + API response caching |
| JWT | Auth tokens |

### Data & ML
| Tool | Purpose |
|------|---------|
| PostgreSQL | Primary database |
| pgvector extension | Stores developer embeddings for similarity search |
| tree-sitter (Python) | AST parser — works across 20+ languages |
| scikit-learn | Clustering + developer type classification |
| spaCy / NLTK | Commit message NLP analysis |
| GitHub GraphQL API v4 | Repo + commit data fetching |
| GitHub REST API | Fallback for rate limits |

### DevOps
| Tool | Purpose |
|------|---------|
| Vercel | Frontend deployment |
| Railway or Render | Node.js + Python backend deployment |
| Supabase | Managed PostgreSQL with pgvector |
| GitHub Actions | CI/CD pipeline |
| Docker | Containerise Python microservice |
| Upstash Redis | Managed Redis for job queue |

---

## 3. System Architecture

```
User Browser
     │
     ▼
┌─────────────────────────────────────────────┐
│           Next.js Frontend (Vercel)          │
│  Pages · D3 Charts · DNA Card · Auth UI      │
└─────────────┬───────────────────────────────┘
              │ REST / GraphQL
              ▼
┌─────────────────────────────────────────────┐
│         Node.js / Express API Server         │
│  Auth · Profile · Compare · Match · Queue    │
│                                              │
│  ┌─────────────┐    ┌──────────────────┐    │
│  │  BullMQ     │    │   Redis Cache     │    │
│  │  Job Queue  │    │   API responses   │    │
│  └──────┬──────┘    └──────────────────┘    │
└─────────┼───────────────────────────────────┘
          │ Async jobs
          ▼
┌─────────────────────────────────────────────┐
│     Python FastAPI — Analysis Microservice   │
│  tree-sitter AST · NLP · scikit-learn ML     │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│         PostgreSQL + pgvector (Supabase)     │
│  users · profiles · fingerprints · vectors   │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│              GitHub API v4 (GraphQL)         │
│  Repos · Commits · Languages · PRs · Stars   │
└─────────────────────────────────────────────┘
```

---

## 4. All Pages — Detailed Breakdown

### Page 1 — Landing Page (`/`)

**Purpose:** Convert visitors into users. Must immediately communicate what Code DNA is and make people want to check their own profile.

**Layout:**
- Full-screen hero section with animated DNA helix or live demo radar chart
- One primary CTA button: **"Analyze My GitHub"** → triggers GitHub OAuth

**Content to include:**
- Headline: *"Your code has a fingerprint. Time to see it."*
- Sub-headline: *"Code DNA analyzes your GitHub history and reveals your developer personality — how you think, code, and communicate."*
- Animated preview of a sample DNA radar chart (autoplay, no interaction needed)
- 3 feature highlights in a horizontal card row:
  - 🧬 Your coding DNA in 60 seconds
  - 🔍 Discover your blind spots
  - 🤝 Find your perfect teammate
- Social proof section: *"Join X developers who've discovered their DNA"* (live counter once you have users)
- Sample DNA cards from fictional developers to show what the output looks like
- FAQ section addressing: "Is my code stored?", "Does this work with private repos?", "How accurate is it?"
- Footer with GitHub link, Twitter/X, and your personal attribution

**Design notes:**
- Dark background with a subtle grid or dot pattern
- Radar chart preview should use the same D3 component from the actual dashboard (reuse, don't fake)
- The CTA button should be the only bright element above the fold

---

### Page 2 — GitHub OAuth / Login (`/login`)

**Purpose:** Clean, trust-building auth page. Many developers are suspicious about what access you're requesting.

**Content to include:**
- Large GitHub logo + "Sign in with GitHub" button
- **Explicit permissions list** — exactly what scopes you're requesting and why:
  - `read:user` — to fetch your profile
  - `public_repo` — to analyze your public repositories
  - *No write access. We cannot modify your repositories.*
- Short reassurance: *"We never store your source code. Only metadata and derived metrics."*
- Link to Privacy Policy
- A small "No GitHub? Analyze any public profile" option with a text input for a username

**Design notes:**
- Centered card layout, minimal
- Trust signals are more important than aesthetics here

---

### Page 3 — Analysis Loading / Processing (`/analyzing/[username]`)

**Purpose:** Keep users engaged while the backend processes their GitHub data. This typically takes 10–30 seconds.

**Content to include:**
- Animated DNA helix or progress indicator (not a spinner — make it interesting)
- Live status messages that update in real-time via Server-Sent Events or WebSocket:
  - *"Fetching your repositories..."*
  - *"Parsing commit history..."*
  - *"Running AST analysis on 847 files..."*
  - *"Identifying your coding patterns..."*
  - *"Generating your DNA profile..."*
- Fun fact cards that rotate while loading: *"Did you know: developers who write longer commit messages have 23% fewer reverts?"*
- Progress bar or step indicators (5 steps)

**Design notes:**
- Full-screen, centered, feels like an "experience" not just a wait
- The live status messages make users feel something real is happening
- This page sets expectations for what they're about to see

---

### Page 4 — DNA Dashboard (`/profile/[username]`)

**Purpose:** The core product page. This is what people will share, screenshot, and come back to. Must be visually stunning and immediately understandable.

**Sections to include:**

#### 4.1 — Profile Header
- GitHub avatar, name, username
- **Developer Type Badge** — large, prominent: *"The Architect"* / *"The Hacker"* / *"The Perfectionist"* / *"The Documenter"* / *"The Debugger"* / *"The Explorer"*
- One-line personality summary: *"You write clean, structured code with excellent naming conventions but rarely write tests first."*
- Stats row: Total repos analyzed · Languages detected · Commits parsed · Analysis date
- "Share DNA Card" button + "Compare with another dev" button

#### 4.2 — DNA Radar Chart (Hero Visual)
- D3.js radar chart with 8 axes:
  1. **Code Readability** — naming, spacing, line length
  2. **Complexity Management** — cyclomatic complexity, nesting depth
  3. **Documentation Quality** — comment ratio, doc strings, README quality
  4. **Test Mindset** — test file count, coverage estimates, assert patterns
  5. **Commit Discipline** — message quality, commit frequency, PR size
  6. **Language Depth** — breadth vs depth across languages
  7. **Refactor Tendency** — how often you revisit and clean up old code
  8. **Error Handling** — try/catch patterns, edge case coverage
- Each axis scored 0–100, displayed with actual score on hover
- Toggleable: show only selected axes

#### 4.3 — Language DNA
- Horizontal stacked bars per language
- Shows: total files · total lines · contribution trend (growing/declining)
- **Claimed vs Proven** indicator — if GitHub bio says "Python developer" but 90% of commits are JavaScript, flag it

#### 4.4 — Coding Patterns Deep Dive
- Naming style: camelCase / snake_case / PascalCase dominance
- Average function length (lines)
- Average nesting depth
- Comment-to-code ratio
- Semicolon usage, trailing comma style (shows consistency)
- Preferred loop style: for / forEach / map / while

#### 4.5 — Commit Personality
- Commit time heatmap (GitHub-style contribution grid, but by hour of day + day of week)
- Most active coding hour
- Commit message tone: Imperative / Descriptive / Cryptic / Emoji-heavy
- Average commit size (lines changed)
- Fix-to-feature ratio (how much time you spend on bugs vs new work)
- Most frequently touched files or directories

#### 4.6 — Blind Spot Detector
- "Skills in your bio vs skills your code proves" side-by-side comparison
- Red flags highlighted: languages listed on profile with < 5 substantive commits
- Growth opportunities: languages you've been trending toward recently

#### 4.7 — Personality Breakdown
- Short paragraph explaining the developer type
- 3 Strengths derived from the analysis
- 3 Growth areas
- "Developers like you include: [3 famous devs with similar DNA patterns]"

**Design notes:**
- The radar chart should be interactive — hover shows exact scores, click an axis for a detailed breakdown
- All sections should be collapsible to reduce overwhelm
- "Last analyzed: X hours ago" with a refresh button
- Mobile responsive — the radar chart must rerender at smaller sizes

---

### Page 5 — Compare Page (`/compare`)

**Purpose:** Let two developers compare their DNA side by side. This is the most shareable page.

**Content to include:**
- Two search inputs at the top: "Developer 1" vs "Developer 2" (pre-filled if coming from a profile)
- **Overlapping radar charts** — two semi-transparent fills on the same radar axes
- Compatibility score: 0–100 with a label (*"Great collaborators"* / *"Complementary skills"* / *"Too similar — low diversity"*)
- Side-by-side stats comparison table
- **Skill gap analysis:** "Dev 1 is stronger in X, Dev 2 is stronger in Y — together they cover Z"
- Shareable URL: `codedna.dev/compare/user1/user2`
- Download as image button (for LinkedIn posts)

---

### Page 6 — Teammate Finder (`/find-teammate`)

**Purpose:** Help developers find collaborators who complement their DNA.

**Content to include:**
- Your DNA radar displayed on the left
- Filters panel:
  - Complementary (find opposite strengths) vs Similar (find like-minded devs)
  - Language filter
  - Activity level filter (how recently they've committed)
- Results grid — developer cards showing:
  - Avatar, username, developer type
  - Match percentage
  - Why they match: *"Balances your low test coverage with high test mindset"*
  - "Compare profiles" button
- Powered by pgvector cosine similarity on stored fingerprint embeddings

---

### Page 7 — Leaderboard (`/leaderboard`)

**Purpose:** Gamification and discoverability. People will share their rankings.

**Content to include:**
- Tabs for each DNA axis: Readability · Test Mindset · Commit Discipline etc.
- Top 100 developers globally per axis
- Your own rank highlighted (if logged in)
- "Top 1% in Code Readability" badge — downloadable
- Weekly/monthly/all-time filters
- Country filter (great for Indian dev community: "Top in India")

---

### Page 8 — Public Profile (`/u/[username]`)

**Purpose:** SEO-optimized public-facing version of a developer's DNA. No login required to view. This drives organic traffic.

**Content to include:**
- Simplified DNA radar chart (read-only, no interaction)
- Developer type + summary
- Key stats: top language, strongest axis, weakest axis
- "Analyze your own profile" CTA at the bottom
- Full Open Graph meta tags so sharing on Twitter/LinkedIn shows a rich preview card

---

### Page 9 — DNA Card Generator (`/card/[username]`)

**Purpose:** Generate a shareable image card (like Spotify Wrapped) for social sharing.

**Content to include:**
- Visual card with: avatar, username, developer type, radar chart preview, top 3 strengths, top language, a signature quote generated from their commit style
- Multiple style options: Dark / Light / Neon / Minimal
- Download as PNG button
- Copy link button
- Pre-filled share text for Twitter and LinkedIn
- This page is the viral engine — make it beautiful

---

### Page 10 — Settings (`/settings`)

**Purpose:** Account management and privacy controls.

**Content to include:**
- Connected GitHub account with option to disconnect
- Repos to exclude from analysis (some people have experimental junk repos)
- Privacy toggle: Public profile / Private (only you can see)
- Re-analyze button (trigger a fresh analysis)
- Notification preferences: email when analysis is complete
- Delete account + data

---

### Page 11 — About / How It Works (`/how-it-works`)

**Purpose:** Build trust with technical users who want to understand the analysis.

**Content to include:**
- Step-by-step explanation of the analysis pipeline
- What data is fetched from GitHub
- How the fingerprint scores are calculated
- What is and isn't stored (build trust)
- The 8 DNA axes explained in detail
- Open source link to the analysis engine (builds developer trust enormously)

---

## 5. Sprint Plan (AI-Assisted Timeline)

> With AI coding tools (Claude, Cursor, Copilot), the actual build time is much faster. Realistic timeline: **2–3 weeks for a solid MVP**, not 8.

### Week 1 — Core + Analysis Engine (Days 1–4)
- **Day 1:** Project setup — Next.js + Tailwind + shadcn/ui + Express backend + Prisma + PostgreSQL (Supabase)
- **Day 2:** GitHub OAuth (NextAuth.js) + GitHub API integration (GraphQL) — fetch repos, languages, commits
- **Day 3:** Python FastAPI microservice + tree-sitter AST parser — extract all code metrics
- **Day 4:** Fingerprint scoring engine — normalise all metrics to 0–100 per axis, store in DB

### Week 1 — Frontend Core (Days 5–7)
- **Day 5:** DNA Dashboard page — profile header, developer type badge, stats row
- **Day 6:** D3.js radar chart component — 8 axes, interactive hover, responsive
- **Day 7:** Language DNA bars + Coding Patterns section + Commit heatmap

### Week 2 — Features + Pages (Days 8–11)
- **Day 8:** Loading/processing page with live SSE status updates
- **Day 9:** Compare page — overlapping radar charts + compatibility score
- **Day 10:** DNA Card generator — Satori image generation, download as PNG, share links
- **Day 11:** Public profile page + Open Graph meta tags

### Week 2 — Polish + Ship (Days 12–14)
- **Day 12:** Teammate Finder + Leaderboard pages
- **Day 13:** Mobile responsiveness pass + error states + loading skeletons + rate limiting
- **Day 14:** Deploy (Vercel + Railway + Supabase) + CI/CD with GitHub Actions + go live

---

## 6. Core Features — MVP

### DNA Radar Chart
- D3.js custom radar chart with 8 axes
- Hover tooltip showing exact score + what it means
- Click an axis to expand a detailed breakdown panel below the chart
- Score context: *"Top 15% globally"* shown under each axis score
- Smooth animated entry on page load

### Developer Personality Type
8 types derived from the axis scores using a decision tree classifier:

| Type | Primary traits |
|------|---------------|
| The Architect | High readability + high complexity management + low test mindset |
| The Perfectionist | High documentation + high readability + high refactor tendency |
| The Hacker | Low documentation + high complexity + high language breadth |
| The Documenter | High documentation + high commit discipline + low complexity |
| The Debugger | High error handling + high refactor tendency + high commit frequency |
| The Explorer | High language breadth + low language depth + high commit frequency |
| The Minimalist | Low line count + high readability + low documentation |
| The Pragmatist | Balanced across all axes, no extreme highs or lows |

### Blind Spot Detector
- Pulls languages listed in GitHub bio / profile README
- Compares against actual language distribution in commits
- Flags any language with < 200 substantive (non-trivial) lines in the last 12 months
- Shows "trending" languages — ones where commits have increased month over month

### Shareable DNA Card
- Generated server-side using Satori (Next.js og-image compatible)
- Contains: avatar, username, type badge, mini radar, top 3 stats, signature quote
- 4 visual themes users can switch between
- One-click download as PNG + Twitter/LinkedIn pre-filled share links

### Dev vs Dev Compare
- Overlapping radar charts with semi-transparent fills
- Compatibility score (cosine similarity between fingerprint vectors)
- Colour-coded: where dev 1 is stronger, where dev 2 is stronger
- Shareable URL structure: `/compare/username1/username2`
- "Team fit" label: Complementary / Similar / Redundant

---

## 7. v2 Features — Growth

### Evolution Timeline
- Fetch commits from the last 3 years, split by quarter
- Animate the radar chart morphing as time progresses (D3 animated transitions)
- Shows when a developer picked up a new language or improved a specific axis
- "Your biggest growth: Test Mindset improved 34 points in Q2 2023"
- Slider to scrub through time

### Teammate Finder
- Uses pgvector `<->` cosine similarity operator on stored 8-dimensional fingerprint vectors
- "Complementary" mode: finds devs whose weak axes match your strong axes
- "Similar" mode: finds devs with the closest overall DNA
- Results show match %, developer type, top languages, GitHub activity level

### Commit Message Analysis (Deep NLP)
- spaCy pipeline on last 500 commit messages
- Detects: imperative vs descriptive style, technical vocabulary richness, emoji usage %, message length trend
- Generates a "commit personality" in a sentence: *"Terse, imperative, highly technical — you write for your future self."*

### Famous Dev Match
- Pre-computed fingerprints for 50 famous open source developers (Linus Torvalds, DHH, TJ Holowaychuk, Sindre Sorhus etc.)
- Cosine similarity match to the user's fingerprint
- Output: *"Your DNA is 84% similar to TJ Holowaychuk"*
- Massively shareable

### Team Analyser (Org DNA)
- Input: a GitHub organization name
- Fetches all public member profiles
- Generates a "team DNA" combining all individual fingerprints
- Shows: team strengths, team blind spots, missing developer archetypes
- "Your team is missing: a Debugger and a Documenter"

### Global Leaderboard
- Ranked per axis — top 100 globally
- Filter by country, language, developer type
- Weekly resets to keep it fresh
- Downloadable ranking badge: *"Top 3% in Code Readability — codedna.dev"*

---

## 8. v3 Features — SaaS Monetisation

### Pricing Tiers

| Plan | Price | Features |
|------|-------|---------|
| Free | $0 | Public repos, basic DNA, shareable card |
| Pro | $9/mo | Private repos, Evolution Timeline, Famous Dev match, priority analysis |
| Teams | $49/mo | Org DNA, Team Analyser, hiring dashboard, API access |

### Resume Enhancer (Pro)
- Takes the user's DNA profile + current resume text
- Claude API rewrites the resume skills section to accurately reflect proven DNA
- Removes unsubstantiated claims, adds specificity from actual commit patterns
- *"Changed 'proficient in Python' to 'Python: 14,000 lines contributed across 8 production repos, strongest in data processing pipelines'"*

### Hiring Dashboard (Teams)
- Recruiters and hiring managers create an account
- Define a "target DNA profile" — the ideal developer fingerprint for a role
- Search the Code DNA database for developers matching the profile
- Sort by match %, location, availability signal (recent activity)
- Send an outreach message through the platform

### GitHub Action + README Badge
- GitHub Action that re-analyzes on every push
- Live badge embeds in any README: `[![Code DNA](https://codedna.dev/badge/username.svg)](https://codedna.dev/u/username)`
- Shows current developer type + top axis score

### Interview Prep Mode (Pro)
- Shows the user's 3 weakest DNA axes
- Generates a personalised study plan for each weak area
- Links to specific resources (courses, practice problems) targeting the gap
- Progress tracking: re-analyze monthly to see improvement

### Public API (Teams)
- REST API for accessing developer DNA scores
- Used by: job boards, developer tools, HR platforms
- Rate-limited per API key
- Enables B2B revenue and ecosystem growth

---

## 9. Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id VARCHAR(50) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  display_name VARCHAR(200),
  avatar_url TEXT,
  github_token TEXT,
  plan VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  last_analyzed_at TIMESTAMP
);

-- Fingerprints table (one per user per analysis run)
CREATE TABLE fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  readability_score INTEGER,
  complexity_score INTEGER,
  documentation_score INTEGER,
  test_mindset_score INTEGER,
  commit_discipline_score INTEGER,
  language_depth_score INTEGER,
  refactor_tendency_score INTEGER,
  error_handling_score INTEGER,
  developer_type VARCHAR(50),
  personality_summary TEXT,
  strengths JSONB,
  growth_areas JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Language breakdown table
CREATE TABLE language_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_id UUID REFERENCES fingerprints(id) ON DELETE CASCADE,
  language VARCHAR(50),
  total_lines INTEGER,
  total_commits INTEGER,
  trend VARCHAR(20),  -- growing, declining, stable
  claimed_in_bio BOOLEAN DEFAULT false
);

-- Commit patterns table
CREATE TABLE commit_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_id UUID REFERENCES fingerprints(id) ON DELETE CASCADE,
  avg_message_length FLOAT,
  commit_style VARCHAR(50),
  most_active_hour INTEGER,
  most_active_day VARCHAR(20),
  avg_commit_size INTEGER,
  fix_to_feature_ratio FLOAT,
  emoji_usage_pct FLOAT
);

-- Feature vectors for similarity search
CREATE TABLE developer_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  embedding vector(8),  -- pgvector 8-dimensional fingerprint
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX ON developer_vectors USING ivfflat (embedding vector_cosine_ops);

-- Analysis jobs table
CREATE TABLE analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, complete, failed
  progress INTEGER DEFAULT 0,
  current_step TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

---

## 10. API Endpoints

### Auth
```
POST   /api/auth/github          OAuth callback handler
POST   /api/auth/logout          Clear session
GET    /api/auth/me              Get current user
```

### Analysis
```
POST   /api/analyze/:username    Trigger analysis job (queues BullMQ job)
GET    /api/analyze/status/:jobId  SSE stream for live progress updates
GET    /api/profile/:username    Get full fingerprint + all sections
GET    /api/profile/:username/radar  Get radar chart data only
GET    /api/profile/:username/languages  Language breakdown
GET    /api/profile/:username/commits    Commit pattern data
```

### Compare & Match
```
GET    /api/compare/:user1/:user2       Compare two developers
GET    /api/match/:username             Find compatible teammates
GET    /api/match/:username/similar     Find similar developers
```

### Leaderboard & Social
```
GET    /api/leaderboard/:axis           Top 100 for a specific axis
GET    /api/card/:username              Generate DNA card image (Satori)
POST   /api/card/:username/download     PNG download
```

### Settings
```
PUT    /api/settings/privacy           Toggle public/private
PUT    /api/settings/excluded-repos    Update excluded repos list
DELETE /api/settings/account           Delete account and all data
POST   /api/settings/reanalyze         Trigger fresh analysis
```

---

## 11. How the Fingerprint Engine Works

### Step 1 — GitHub Data Collection
```
GitHub GraphQL API → fetch:
  - All public repos (name, language, stars, last push date)
  - Last 1000 commits across top 10 repos by activity
  - README content per repo
  - Contributor stats
  - User bio and listed skills
```

### Step 2 — Repository Selection
- Filter: repos with < 3 commits excluded (forks, experiments)
- Select top 10 repos by: recent activity + commit count + language diversity
- Cap total files at 5000 to stay within analysis limits

### Step 3 — AST Parsing (Python / tree-sitter)
For each selected file, tree-sitter generates a syntax tree and extracts:
```python
metrics_per_file = {
  "avg_function_length": ...,      # lines per function
  "max_nesting_depth": ...,        # deepest if/loop nesting
  "naming_consistency_score": ..., # camelCase vs snake_case uniformity
  "comment_ratio": ...,            # comment lines / total lines
  "has_docstrings": ...,           # function-level documentation
  "error_handling_coverage": ...,  # try/catch blocks vs uncovered IO calls
  "test_patterns_detected": ...,   # assert, expect, describe, it() patterns
  "magic_numbers_count": ...,      # unexplained numeric literals
}
```

### Step 4 — Commit Analysis (NLP)
```python
commit_metrics = {
  "avg_message_length": ...,
  "imperative_ratio": ...,    # "Add feature" vs "Added feature" vs "feature"
  "technical_vocabulary": ..., # domain-specific terms per message
  "emoji_usage_pct": ...,
  "wip_commit_ratio": ...,    # "wip", "temp", "fix", "hotfix" frequency
  "message_quality_score": ...,
}
```

### Step 5 — Scoring (0–100 per axis)
All raw metrics are normalised against the global distribution of analyzed developers using min-max scaling, then weighted and combined:

```
Readability Score = (
  naming_consistency  × 0.35 +
  avg_function_length × 0.25 +  (inverted — shorter = better)
  magic_numbers_count × 0.20 +  (inverted)
  comment_ratio       × 0.20
) normalised to 0–100

Test Mindset Score = (
  test_patterns_detected × 0.50 +
  test_file_ratio        × 0.30 +
  assert_density         × 0.20
) normalised to 0–100

... (same for all 8 axes)
```

### Step 6 — Type Classification
```python
# Decision tree classifier trained on labeled developer profiles
developer_type = classify(fingerprint_vector)
# Returns: "The Architect", "The Hacker", etc.
# + confidence score (e.g. 78% Architect, 15% Perfectionist)
```

### Step 7 — Vector Storage
The 8 normalised scores are stored as a vector in pgvector for similarity search:
```sql
INSERT INTO developer_vectors (user_id, embedding)
VALUES ($1, '[72, 45, 88, 23, 91, 67, 54, 78]'::vector);
```

---

## 12. Deployment Setup

### Frontend (Vercel)
```bash
# Environment variables needed
NEXTAUTH_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXT_PUBLIC_API_URL=https://api.codedna.dev
```

### Backend (Railway)
```bash
# Node.js service environment variables
DATABASE_URL=postgresql://...    # Supabase connection string
REDIS_URL=rediss://...           # Upstash Redis URL
GITHUB_TOKEN=                    # GitHub PAT for higher API limits
JWT_SECRET=
ANALYSIS_SERVICE_URL=http://python-service:8000
```

### Python Microservice (Railway / Docker)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN python -m spacy download en_core_web_sm
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### GitHub Actions CI/CD
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
  deploy-frontend:
    needs: test
    uses: vercel/action@v1
  deploy-backend:
    needs: test
    uses: railway deploy
```

---

## 13. Launch Strategy

### Pre-Launch (While Building — Week 1)
- Create a Twitter/X account: `@CodeDNA_dev`
- Post build progress daily: *"Day 3: AST parser now extracts naming conventions from 20+ languages"*
- Create a waitlist landing page on Day 1 (before anything works) — collect emails

### Launch Day
1. Post on **Reddit**: r/webdev, r/programming, r/cscareerquestions — *"I built a tool that generates your coding DNA from GitHub"*
2. Submit to **Product Hunt** — schedule for Tuesday/Wednesday 12:01am PST
3. Post a demo video on **LinkedIn** — show your own DNA card live
4. Post the **shareable DNA card** on Twitter with: *"Here's my Code DNA. What's yours? → codedna.dev"*
5. Post on **Dev.to** and **Hashnode**: *"How I built Code DNA — AST parsing, pgvector similarity search, and D3.js in 2 weeks"*

### Growth Loop (Post-Launch)
- The **DNA card** is the growth engine — every share drives new users
- Add "Analyzed by Code DNA" watermark on free tier cards (removable on Pro)
- Weekly email to users: *"Your DNA has been updated — your Readability score improved by 8 points"*
- GitHub README badge drives passive traffic from every developer who embeds it

### Getting Internship Interviews From It
- DM recruiters at companies you want with: *"I built a full-stack developer analytics platform — here's the link, here's your team's DNA"*
- Pull up the interviewer's GitHub profile analysis live during technical interviews
- Write a detailed technical blog post — this alone will get you inbound recruiter messages
- Add the GitHub stars count to your resume once you have them (aim for 100+ before applying)

---

*Built with: Next.js · Node.js · Python · PostgreSQL · Redis · D3.js · tree-sitter · pgvector*

*Your code has a fingerprint. Time to see it.*
